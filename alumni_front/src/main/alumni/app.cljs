(ns alumni.app
  (:require
   [reagent.core :as r]
   [reagent.dom.client :as rdomc]))

(defonce tickets (r/atom {}))

(def refresh-interval-ms (* 30 1000))

(def production-url "https://alumni.valentin-mouret.workers.dev")
(def local-url "http://localhost:8787")
(def base-url
  ; local-url
  production-url)

(defn url
  [uri]
  (str base-url uri))

(defn status-ok?
  [r]
  (= 200 (.-status r)))

(defn ->ticket
  [{:keys [checked_in_at] :as m}]
  (if checked_in_at
    (assoc m :checked_in_at (new js/Date checked_in_at))
    m))

(defn parse-tickets-response
  [coll]
  (->> (js->clj coll {:keywordize-keys true})
       (map ->ticket)))

(defn update-tickets
  [coll]
  (reset! tickets (->> coll
                       (map (juxt :id identity))
                       (into {}))))

(defn on-tickets-response
  [r]
  (when (status-ok? r)
    (-> (.json r)
        (.then (comp update-tickets parse-tickets-response)))))

(defn fetch-tickets
  []
  (-> (js/fetch (url "/tickets"))
      (.then on-tickets-response)))

(defn set-check-in
  [id]
  (swap! tickets #(assoc-in % [id :checked_in_at] (new js/Date))))

(defn unset-check-in
  [id]
  (swap! tickets #(update-in % [id] dissoc :checked_in_at)))

(defn on-check-in-response
  [id r]
  (when (status-ok? r)
    (set-check-in id)))

(defn on-check-in-delete-response
  [id r]
  (when (status-ok? r)
    (unset-check-in id)))

(defn json-request
  ([url payload] (json-request url payload "POST"))
  ([url payload method]
   (js/fetch url
             (clj->js {:method method
                       :body (js/JSON.stringify (clj->js payload))}))))

(defn check-in
  [id]
  (let [payload {:ticket_id id}]
    (-> (json-request (url "/check_in") payload)
        (.then (partial on-check-in-response id)))))

(defn delete-check-in
  [id]
  (let [payload {:ticket_id id}]
    (-> (json-request (url "/check_in") payload "DELETE")
        (.then (partial on-check-in-delete-response id)))))

(defonce search (r/atom nil))

(defn time-ago
  [t]
  (let [time-ms     (.getTime t)
        now-ms      (.getTime (new js/Date))
        diff        (js/Math.floor (/ (- now-ms time-ms) 1000))
        seconds-ago diff
        minutes-ago (quot seconds-ago 60)
        hours-ago   (quot minutes-ago 60)]
    (cond (> hours-ago 0) (str hours-ago " h ago")
          (> minutes-ago 0) (str minutes-ago " min ago")
          (> seconds-ago 0) (str seconds-ago " sec ago")
          :else             "Just now")))

(defn app []
  (let [search-pattern            (when @search (re-pattern (str "(?i)" @search)))
        considered-tickets        (if search-pattern
                                    (filter (fn [{:keys [first_name last_name]}]
                                              (or (re-find search-pattern first_name)
                                                  (re-find search-pattern last_name)))
                                            (vals @tickets))
                                    (vals @tickets))
        {:keys [inside outside]}  (->> considered-tickets
                                       (sort-by :last_name)
                                       (group-by #(if (:checked_in_at %) :inside :outside)))]
    [:<>
     [:div
      [:input {:id "search" :type "text" :placeholder "Recherche" :value @search :on-change #(reset! search (.. % -target -value))}]]
     (when (seq outside)
       [:<>
        [:h2 "Dehors " [:span.faded "(" (count outside) ")"]]
        [:ul
         (for [{:keys [id first_name last_name]} outside]
           [:li {:key id
                 :on-click #(check-in id)}
            (str first_name " " last_name)])]])
     (when (seq inside)
       [:<>
        [:h2 "Dedans " [:span.faded (str "(" (count inside) ")")]]
        [:ul
         (for [{:keys [id first_name last_name checked_in_at]} inside]
           [:li {:key id :class "highlighted"
                 :on-click #(delete-check-in id)}
            (str first_name " " last_name)
            [:span.faded (str " (" (time-ago checked_in_at) ")")]])]])]))

(defn init!
  []
  (let [root (rdomc/create-root (js/document.getElementById "app"))]
    (.then (fetch-tickets)
           (rdomc/render root [app]))))

(js/document.addEventListener "DOMContentLoaded"
                              init!)

(js/setInterval fetch-tickets refresh-interval-ms)

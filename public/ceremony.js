const url = "http://localhost:8787"

async function fetchTickets() {
  const response = await fetch(`${url}/tickets`)
  return await response.json()
}

function sortByName(tickets) {
  return tickets.sort((a, b) => {
    let nameA = a.last_name.toUpperCase()
    let nameB = b.last_name.toUpperCase()
    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }
    return 0
  })
}

function renderDehors(root, tickets) {
  const dehors = document.createElement("h2")
  dehors.textContent = "Dehors"
  root.appendChild(dehors)

  const dehorsList = document.createElement("ul")
  for (const ticket of sortByName(tickets)) {
    const item = document.createElement("li")
    item.textContent = ticket.first_name + " " + ticket.last_name
    item.className = "clear"
    dehorsList.appendChild(item)
  }
  root.appendChild(dehorsList)
}

function renderDedans(root, tickets) {
  const dedans = document.createElement("h2")
  dedans.textContent = "Dedans"
  root.appendChild(dedans)

  const dedansList = document.createElement("ul")

  for (const ticket of sortByName(tickets)) {
    const item = document.createElement("li")
    item.textContent = ticket.first_name + " " + ticket.last_name
    item.className = "highlighted"
    dedansList.appendChild(item)
  }
}

async function hydratePage() {
  const tickets = await fetchTickets()
  // group tickets by status, depending on whether or not they have a created_at field
  const [pending, confirmed] = tickets.reduce(
    ([pending, confirmed], ticket) => {
      if (ticket.created_at) {
        return [pending, [...confirmed, ticket]]
      } else {
        return [[...pending, ticket], confirmed]
      }
    },
    [[], []]
  )

  const root = document.getElementById("app")

  if (pending.length > 0) renderDehors(root, pending)
  if (confirmed.length > 0) renderDedans(root, confirmed)
}

hydratePage().then(() => {})

const currentDate = new Date()
const deadline = new Date('2023-06-10')

function dateDifferenceInDays(d1, d2) {
     const t2 = d2.getTime()
     const t1 = d1.getTime()

    return Math.floor((t2-t1) / (24 * 3_600 * 1_000)) + 2 // current day and deadline day
}

function setTimeUntilDeadline() {
    const node = document.getElementById("days-left")
    const difference = dateDifferenceInDays(currentDate, deadline)
    node.textContent = difference > 0 ? `encore ${difference} jour${difference == 1 ? '' : 's'}` : "aller, dépéchez-vous !"
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeUntilDeadline()
    // Every hour, refresh
    setInterval(setTimeUntilDeadline, 60 * 60 * 1_000)
})

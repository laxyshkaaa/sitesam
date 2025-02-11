const API_BASE = 'http://localhost:8082/api/v1/'
const API_EMPLOYEES = `${API_BASE}employees`
const API_NEWS = `${API_BASE}news`
const API_EVENTS = `${API_BASE}events`

async function loadData(url, containerId, createCard) {

    const response = await fetch(url)
    const data = await response.json()
    const container = document.getElementById(containerId)
    container.innerHTML = ''
    data.forEach(item => container.appendChild(createCard(item)))
}

function createEmployeeCard(employee){
    const card = document.createElement('div')
    card.className = 'carts'
    card.innerHTML = `<h1>${employee.last_name} ${employee.first_name} ${
			employee.patronymic
		}</h1>
    <p>${employee.post}</p>
    <p>${employee.work_phone}</p>
    <p>${employee.corporative_email}</p>
	 <p>${new Date(employee.birth_date).toLocaleString('ru-RU', {
			day: 'numeric',
			month: 'long',
		})}</p>
    <button class = "qr-code-button">&#128190</button>`

    card.querySelector('.qr-code-button').addEventListener('click', () => createQRCode(employee))
    return card
}

function createQRCode(employee){
    const vCard = `
BEGIN:VCARD
VERSION:3.0
N:${employee.first_name}
FN:${employee.last_name}
ORG:Дороги России
TITLE:${employee.post}
TEL;WORK;VOICE:${employee.work_phone}
TEL;CELL:${employee.perosnal_phone}
EMAIL;WORK;INTERNET:${employee.corporative_email}
END:VCARD
`.trim()

    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.innerHTML = `<div class = "modal-content">
     <span class = "close-button">&times;</span>
     <h3>QR-code сотрудника</h3>
     <div id="qrcode"></div>
    </div>`

    document.body.appendChild(modal)
    modal.addEventListener('click', ()=> modal.remove())
    new QRCode(modal.querySelector('#qrcode'), {
        text : vCard,
        width : 200,
        height: 200,
        correctLevel : QRCode.CorrectLevel.L,
    
    })
    modal.style.display = 'block'
}

function createNewsCard(news){
    const card = document.createElement('div')
    
    card.innerHTML = `<div class = "news-image-container"> 
    <img src = "http://localhost:8082/${news.path_to_photo}" class= "news-image">
    </div>
    <div class = "news-content">
    <h3>${news.title}</h3>
    <p>${new Date(news.date_news).toLocaleDateString()}</p>
    <p>${news.description}</p>
    </div>`

    return card

}

function createEventCard(event){
    const card = document.createElement('div')
		card.classList.add('event-card')
		card.innerHTML = `
        <h3>${event.title}</h3>
        <p>${new Date(event.started_at).toLocaleDateString()}</p>
        <p>${event.author_name}</p>
        <p>${event.description}</p>`
        
		return card
}


document.addEventListener('DOMContentLoaded', ()=> {
    loadData(API_EMPLOYEES, 'employees', createEmployeeCard)
    loadData(API_NEWS, 'news', createNewsCard)
    loadData(API_EVENTS, 'events', createEventCard)
    createCalendar(
			document.getElementById('calendar'),
			new Date().getFullYear(),
			new Date().getMonth() + 1
		)
})


document.getElementById('search-input').addEventListener('input', async e => {
    const query = e.target.value.toLowerCase()
    if (query.length === 0){
        loadData(API_EMPLOYEES, 'employees', createEmployeeCard)
				loadData(API_NEWS, 'news', createNewsCard)
				loadData(API_EVENTS, 'events', createEventCard)
                return
    }

    const employeeResponse = await fetch(API_EMPLOYEES)
    const employees = await employeeResponse.json()
    const filteredE = employees.filter(employee =>
    `${employee.last_name} ${employee.first_name} ${employee.patronymic} ${employee.post}`.toLowerCase().includes(query) 
    )
    document.getElementById('employees').innerHTML = ''
    filteredE.forEach(employee => document.getElementById('employees').appendChild(createEmployeeCard(employee)))

    const newsResponse = await fetch(API_NEWS)
		const news = await newsResponse.json()
		const filteredN = news.filter(item =>
			`${item.title} ${item.description}`
				.toLowerCase()
				.includes(query)
		)
		document.getElementById('news').innerHTML = ''
		filteredN.forEach(item =>
			document
				.getElementById('news')
				.appendChild(createNewsCard(item))
		)

    const eventResponse = await fetch(API_EVENTS)
		const events = await eventResponse.json()
		const filteredEV = events.filter(event =>
			`${event.title} ${event.description}`
				.toLowerCase()
				.includes(query)
		)
		document.getElementById('events').innerHTML = ''
		filteredEV.forEach(event =>
			document
				.getElementById('events')
				.appendChild(createEventCard(event))
		)    
})

async function createCalendar(elem, year, month) {
	elem.innerHTML = ''

	let header = document.createElement('div')
	header.className = 'calendar-header'
	header.innerHTML = `
        <button id="prev-month"><</button>
        <span id="calendar-month-year">${getMonthName(month)} ${year}</span>
        <button id="next-month">></button>
    `
	elem.append(header)

	let table = document.createElement('table')
	let thead = document.createElement('thead')
	let theadRow = document.createElement('tr')
	;['П', 'В', 'С', 'Ч', 'П', 'С', 'В'].forEach(day => {
		let th = document.createElement('th')
		th.textContent = day
		theadRow.append(th)
	})
	thead.append(theadRow)
	table.append(thead)

	// 📌 ОПТИМИЗАЦИЯ: Загружаем данные ОДИН РАЗ
	const employees = await fetch(API_EMPLOYEES).then(res => res.json())
	const events = await fetch(API_EVENTS).then(res => res.json())

	let dateStart = new Date(year, month - 1, 1)
	let dateEnd = new Date(year, month, 0)
	let dayStart = dateStart.getDate()
	let dayEnd = dateEnd.getDate()
	let weekDayStart = dateStart.getDay() == 0 ? 7 : dateStart.getDay()

	let tbody = document.createElement('tbody')
	let currentDay = dayStart

	for (let i = 0; i < 6; i++) {
		let tr = document.createElement('tr')
		for (let j = 1; j <= 7; j++) {
			let td = document.createElement('td')
			if ((i === 0 && j < weekDayStart) || currentDay > dayEnd) {
				td.innerHTML = ''
			} else {
				td.textContent = currentDay
				td.className = 'calendar-day'

				// Выходной день
				if (j === 6 || j === 7) {
					td.classList.add('weekend')
				}

				// Текущий день
				const today = new Date()
				if (
					today.getFullYear() === year &&
					today.getMonth() + 1 === month &&
					today.getDate() === currentDay
				) {
					td.classList.add('today')
				}

				// 🎂 День рождения (ищем среди загруженных сотрудников)
				if (
					employees.some(employee => {
						const birthDate = new Date(employee.birth_date)
						return (
							birthDate.getDate() === currentDay &&
							birthDate.getMonth() + 1 === month
						)
					})
				) {
					td.innerHTML += '&#127856'
					td.classList.add('birthday')
				}

				// 🔥 События (ищем среди загруженных событий)
				const eventCount = events.filter(event => {
					const eventDate = new Date(event.started_at)
					return (
						eventDate.getDate() === currentDay &&
						eventDate.getMonth() + 1 === month &&
						eventDate.getFullYear() === year
					)
				}).length

				if (eventCount > 0) {
					td.style.backgroundColor = getEventColor(eventCount)
				}

				currentDay++
			}
			tr.append(td)
		}
		tbody.append(tr)
	}

	table.append(tbody)
	elem.append(table)

	// Навигация по месяцам
	document.getElementById('prev-month').addEventListener('click', () => {
        const newMonth = month === 1 ? 12 : month - 1
        const newYear = month === 1 ? year - 1 : year
        createCalendar(elem, newYear, newMonth)
    })

    document.getElementById('next-month').addEventListener('click',() =>{
        const newMonth = month === 12 ? 1 : month + 1
        const newYear = month === 12 ? year + 1 : year
        createCalendar(elem, newYear, newMonth)
    } )
}


function getEventColor(eventCount){
    if(eventCount >=5 ) return '#FC4343'
    if (eventCount < 2) return '#89FC43'
    return '#F8FC43'
    
}




function getMonthName(month){
    const names = [
			'Январь',
			'Февраль',
			'Март',
			'Апрель',
			'Май',
			'Июнь',
			'Июль',
			'Август',
			'Сентябрь',
			'Октябрь',
			'Ноябрь',
			'Декабрь',
		]
        return names[month - 1]
}
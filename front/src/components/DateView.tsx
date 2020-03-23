import React from "react"
import DayPicker from "react-day-picker"
import { useHistory } from "react-router-dom"

import AsyncFetcher from "./AsyncFetcher"

interface DateLookup {
    [ year: number ]: { [ month: number ]: number[] }
}

interface DateViewContentProps {
    lookup: DateLookup
    start: number[]
    end: number[]
}

function lookupDate(date: Date, lookup: DateLookup) {
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()

    return !(lookup[year] && lookup[year][month] && lookup[year][month].indexOf(day) != -1)
}

function DateViewContent(props: DateViewContentProps) {
    let start = new Date(`${props.start[0]}/${props.start[1]}/${props.start[2]}`)
    let end = new Date(`${props.end[0]}/${props.end[1]}/${props.end[2]}`)

    const history = useHistory()
    
    return (
	<DayPicker
	pagedNavigation
	fromMonth={start}
	toMonth={end}
	numberOfMonths={12}
	disabledDays={d => lookupDate(d, props.lookup)}
	onDayClick={d => {
	    let year = d.getFullYear()
	    let month = d.getMonth() + 1
	    let day = d.getDate()

	    history.push(`/c_lang_cn/${year}/${month}/${day}`)
	}}
	/>
    )
}

export default function DateView() {
    const request = async () => {
	let res = await fetch(`/api/date`)
	let body = await res.json()

	let start = body[0]
	let end = body[body.length - 1]

	let lookup: DateLookup = {}

	body.forEach((e: number[]) => {
	    let [year, month, day] = e
	    if (!lookup[year]) lookup[year] = {}
	    if (!lookup[year][month]) lookup[year][month] = []
	    lookup[year][month].push(day)
	})

	return [lookup, start, end]
    }

    return (
	<AsyncFetcher promise={request()}>
	{
	    res => {
		let [lookup, start_date, end_date] = res
		return <DateViewContent lookup={lookup} start={start_date} end={end_date} />
	    }
	}
	</AsyncFetcher>
    )
}

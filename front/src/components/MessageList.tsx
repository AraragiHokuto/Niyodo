import React from 'react'
import { HTMLTable, Text, Colors } from '@blueprintjs/core'
import { useHistory } from 'react-router-dom'

import AsyncFetcher from './AsyncFetcher'

type MsgType = "MODE" | "ACTION" | "TOPIC" | "KICK"
	     | "PART" | "NICK" | "PRIVMSG" | "QUIT" | "JOIN"

interface Message {
    id: number
    type: MsgType
    sender: string
    content: string
    datetime: number[]   
}

function padStart(str: string, len: number, padding: string) {
    // I should probably add left-padding as dependency (w)
    return (padding + str).slice(str.length - len + padding.length, str.length + padding.length)
}

function Message(message: Message) {
    let datetime
    if (message.datetime.length == 3) {
	let hour = padStart(message.datetime[0].toString(), 2, "00")
	let minute = padStart(message.datetime[0].toString(), 2, "00")
	datetime = <span>{hour}:{minute} </span>
    } else {
	let year = message.datetime[0].toString()
	let month = padStart(message.datetime[1].toString(), 2, "00")
	let day = padStart(message.datetime[2].toString(), 2, "00")
	let hour = padStart(message.datetime[0].toString(), 2, "00")
	let minute = padStart(message.datetime[0].toString(), 2, "00")
	datetime = <span>{year}/{month}/{day} {hour}:{minute} </span>
    }

    switch (message.type) {
	case "MODE":
	    return (
		<Text ellipsize>
		    {datetime} *mode {message.content} by <b>{message.sender}</b>
		</Text>
	    )
	case "ACTION":
	    return (
		<Text ellipsize>
		    {datetime} *<b>{message.sender}</b> <i>{message.content}</i>
		</Text>
	    )
	case "TOPIC":
	    return (
		<Text ellipsize>
		{datetime} TOPIC {message.content}
		</Text>
	    )
	case "KICK":
	    return (
		<Text ellipsize>
		    {datetime} KICK {message.content} by <b>{message.sender}</b>
		</Text>
	    )
	case "PART":
	    return (
		<Text ellipsize>
		    {datetime} <b>{message.sender}</b> left channel: {message.content}
		</Text>
	    )
	case "NICK":
	    return (
		<Text ellipsize>
		    {datetime} <b>{message.sender}</b> is now known as <b>{message.content}</b>
		</Text>
	    )
	case "JOIN":
	    return (
		<Text ellipsize>
		    {datetime} <b>{message.sender}</b> joined us.
		</Text>
	    )
	case "QUIT":
	    return (
		<Text ellipsize>
		{datetime} <b>{message.sender}</b> go offline: {message.content}
		</Text>
	    )
	case "PRIVMSG":
	    return (
		<Text ellipsize>
		{datetime} <b>{message.sender}: </b>{message.content}
		</Text>
	    )
    }
}

interface MessageListEntryProps {
    msg: Message
    scrollTarget?: boolean
    clickable?: boolean
}

function MessageListEntry(props: MessageListEntryProps) {
    let history = useHistory()

    let ref = React.createRef<HTMLTableRowElement>()

    let [scrollTarget, setScrollTarget] = React.useState(props.scrollTarget)
    let clickable = React.useState(props.clickable || scrollTarget)[0]
    
    const onClick = () => {
	if (props.msg.datetime.length === 6) {
	    let year = props.msg.datetime[0]
	    let month = props.msg.datetime[1]
	    let day = props.msg.datetime[2]

	    history.push(`/c_lang_cn/${year}/${month}/${day}?ref=${props.msg.id}`)
	} else {
	    setScrollTarget(false)
	}
    }

    React.useEffect(() => {
	if (!props.scrollTarget) return
	ref.current?.scrollIntoView({ behavior: 'smooth', block: "center" })
    })
    
    return (
	<tr style={scrollTarget ? { backgroundColor: Colors.COBALT1 } : {}} onClick={clickable ? onClick : undefined} ref={ref}>
	    <td style={scrollTarget ? { color: "white" } : {}}>
		{Message(props.msg)}
	    </td>
	</tr>
    )
}

interface MessageListViewProps {
    msg: Message[]
    scrollTo?: number
    interactive?: boolean
}

function MessageListView(props: MessageListViewProps) {
    let list = props.msg.map((m, i) => <MessageListEntry clickable={props.interactive} scrollTarget={props.scrollTo !== undefined && props.scrollTo === m.id} msg={m} key={i} />)
    return (
	<HTMLTable striped style={{ tableLayout: "fixed", width: "100%" }} interactive={props.interactive}>
	    <tbody>
		{list}
	    </tbody>
	</HTMLTable>
    )
}

interface MessageListProps {
    year: string
    month: string
    day: string
    scrollTo?: number
}

export function MessageList(props: MessageListProps) {
    let promise = async () => {
	let res = await fetch(`/api/msg?year=${props.year}&month=${props.month}&day=${props.day}`)
	let json = await res.json()
	return json.messages as Message[]
    }
    
    return (
	<AsyncFetcher promise={promise()}>
	    {msg => <MessageListView msg={msg} scrollTo={props.scrollTo} />}
	</AsyncFetcher>
    )
}

interface MessageSearchProps {
    query: string
}

export function MessageSearch(props: MessageSearchProps) {
    let promise = async () => {
	let res = await fetch(`/api/search?query=${props.query}`)
	let json = await res.json()
	return json.messages as Message[]
    }

    return (
	<AsyncFetcher promise={promise()}>
	    {msg => <MessageListView msg={msg} interactive/>}
	</AsyncFetcher>
    )
}

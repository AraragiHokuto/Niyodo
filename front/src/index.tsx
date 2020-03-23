import React from "react"
import ReactDOM from "react-dom"
import PropTypes from "prop-types"

import { BrowserRouter as Router, Switch, Route, Redirect, RouteComponentProps, useHistory, useLocation } from "react-router-dom"
import { Navbar as BPNavbar, Alignment, Button, Text, InputGroup } from "@blueprintjs/core"

import { MessageList, MessageSearch } from "./components/MessageList"
import DateView from "./components/DateView"

interface NavbarProps {
    title: string
}

function Navbar(props: NavbarProps) {
    const history = useHistory()

    const onHome = () => history.push('/')

    let ref = React.useRef<HTMLInputElement>()

    const setRef = (r: HTMLInputElement | null) => {
	if (!r) return
	ref.current = r
    }
    
    const onSearch = () => {
	if (!ref.current) return

	let query = encodeURIComponent(ref.current.value)

	history.push(`/search?query=${query}`)
    }
    
    return (
	<BPNavbar fixedToTop className="bp3-dark">
	    <BPNavbar.Group align={Alignment.LEFT}>
		<BPNavbar.Heading>Niyodo</BPNavbar.Heading>
		<BPNavbar.Divider />
		<Button className="bp3-minimal" icon="home" text="Home" onClick={onHome} />
		<BPNavbar.Divider />
		<Text>{props.title}</Text>
	    </BPNavbar.Group>
	    <BPNavbar.Group align={Alignment.RIGHT}>
		<form
		    onSubmit={e => {
			e.preventDefault()
			onSearch()
		    }}
		>
		    <InputGroup
			inputRef={setRef}
			placeholder="Search Here"
			leftIcon="search"
		    />
		</form>
	    </BPNavbar.Group>
	</BPNavbar>
    )
}

interface PageLogParams {
    year: string
    month: string
    day: string
}

interface PageContainerProps {
    children: PropTypes.ReactNodeLike
}

function PageContainer(props: PageContainerProps) {    
    return (
	<div style={{ width: "60%", margin: "auto", marginTop: "60px", overflow: "hidden" }}>
	    {props.children}
	</div>
    )
}

function PageLog(props: RouteComponentProps<PageLogParams>) {
    let year = props.match.params.year
    let month = props.match.params.month
    let day = props.match.params.day

    let title = `Log: ${year}/${month}/${day} for #c_lang_cn`

    let location = useLocation()
    let refs = new URLSearchParams(location.search).get("ref")
    let ref = refs && parseInt(refs)

    return (
	<div>
	    <Navbar title={title} />
	    <PageContainer>
	    <MessageList year={year} month={month} day={day} scrollTo={typeof(ref) === "number" ? ref : undefined}/>
	    </PageContainer>
	</div>
    )
}

function PageChannel() {
    let title = `Channel: #c_lang_cn`
    return (
	<div>
	    <Navbar title={title} />
	    <PageContainer>
		<DateView />
	    </PageContainer>
	</div>
    )
}

function PageSearch() {
    let title = `Search Result`
    let location = useLocation()

    let query = new URLSearchParams(location.search).get("query") as string
    
    return (
	<div>
	    <Navbar title={title} />
	    <PageContainer>
		<MessageSearch query={encodeURIComponent(query)} />
	    </PageContainer>
	</div>
    )
}

export default function App() {
    return (
	<Router>
	    <Switch>
		<Route path="/c_lang_cn/:year/:month/:day" component={PageLog} />
		<Route path="/c_lang_cn" component={PageChannel} />
		<Route path="/search" component={PageSearch} />
		<Route path="/">
		    <Redirect to="/c_lang_cn" />
		</Route>
	    </Switch>
	</Router>
    )
}
	    

ReactDOM.render(
    <App />,
    document.getElementById("container")
)

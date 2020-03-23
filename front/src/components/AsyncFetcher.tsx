import React from "react"
import PropTypes from "prop-types"

import { Colors } from "@blueprintjs/core"

import ReactLoading from 'react-loading'

interface AsyncFetcherProps<T> {
    promise: Promise<T>
    children: (result: T) => PropTypes.ReactElementLike
}

export default function AsyncFetcher<T>(props: AsyncFetcherProps<T>) {
    let [result, useResult] = React.useState<T | null>(null)

    props.promise.then(result => useResult(result))

    console.log(result)

    if (!result) {
	return (
	    <div style={{
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%'
	    }}>
		<ReactLoading type="bars" color={Colors.GRAY1} height='20%' width='20%' />
	    </div>
	)
    } else {
	return props.children(result)
    }
}

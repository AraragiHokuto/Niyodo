package main

import (
	"flag"
	"kuroshiho.org/niyodo"
)

var (
	listen_addr string
	dbname,
	dbuser,
	dbpwd string
	debug bool
)

func parse_cmd() {
	flag.StringVar(&dbname, "database", "niyodo", "Database name")
	flag.StringVar(&dbuser, "user", "niyodo", "User for database")
	flag.StringVar(&dbpwd, "password", "", "Password for database")
	flag.StringVar(&listen_addr, "listen", ":8080", "Address to listen to")
	flag.BoolVar(&debug, "debug", false, "Start in debug mode")
	flag.Parse()
}

func main() {
	parse_cmd()
	niyodo.Start(listen_addr, dbname, dbuser, dbpwd, debug)
}

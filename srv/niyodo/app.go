package niyodo

import (
	"github.com/gin-gonic/gin"
	"strconv"
)

var db *DBInstance

func GetDates(c *gin.Context) {
	ret, err := db.Dates()
	if err != nil {
		c.AbortWithError(500, err)
		return
	}

	c.JSON(200, ret)
}

func GetMessage(c *gin.Context) {
	year, err := strconv.Atoi(c.DefaultQuery("year", "0"))
	hasErr := (err != nil)
	month, err := strconv.Atoi(c.DefaultQuery("month", "0"))
	hasErr = hasErr || (err != nil)
	day, err := strconv.Atoi(c.DefaultQuery("day", "0"))
	hasErr = hasErr || (err != nil)

	if hasErr {
		c.JSON(400, gin.H{"reason": "bad query params"})
		return
	}

	ret, err := db.Messages(year, month, day)
	if err != nil {
		c.AbortWithError(500, err)
		return
	}

	response := make([]gin.H, 0, len(ret))
	for _, m := range ret {
		response = append(response, gin.H{
			"id":       m.id,
			"type":     m.msgtype,
			"sender":   m.sender,
			"content":  m.content,
			"datetime": m.datetime,
		})
	}

	c.JSON(200, gin.H{
		"messages": response,
	})
}

func GetSearch(c *gin.Context) {
	query := c.DefaultQuery("query", "")

	ret, err := db.Search(query)
	if err != nil {
		c.AbortWithError(500, err)
	}

	response := make([]gin.H, 0, len(ret))
	for _, m := range ret {
		response = append(response, gin.H{
			"id": m.id,
			"type":     m.msgtype,
			"sender":   m.sender,
			"content":  m.content,
			"datetime": m.datetime,
		})
	}

	c.JSON(200, gin.H{
		"messages": response,
	})
}

func Start(listen, dbname, dbuser, dbpwd string, debug bool) {
	dbi, err := NewDB(dbname, dbuser, dbpwd)
	if err != nil {
		panic(err)
	}
	db = dbi

	if !debug {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()
	router.GET("/msg", GetMessage)
	router.GET("/date", GetDates)
	router.GET("/search", GetSearch)

	router.Run(listen)
}

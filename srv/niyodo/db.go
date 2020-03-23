package niyodo

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
	"strings"
)

type DBInstance struct {
	sqldb *sql.DB
}

const _STMT_SEARCH = `
SELECT id, type, sender, content,
       DATE_PART('year', datetime),
       DATE_PART('month', datetime),
       DATE_PART('day', datetime),
       DATE_PART('hour', datetime),
       DATE_PART('minute', datetime),
       DATE_PART('second', datetime)
FROM message WHERE %s ORDER BY datetime, id
`
const _STMT_DATE = `
SELECT DISTINCT DATE_PART('year', datetime),
                DATE_PART('month', datetime), 
                DATE_PART('day', datetime)
FROM message`

const _STMT_MSG = `
SELECT id, type, sender, content,
       DATE_PART('hour', datetime),
       DATE_PART('minute', datetime),
       DATE_PART('second', datetime)
FROM message
WHERE DATE_PART('year', datetime) = $1
  AND DATE_PART('month', datetime) = $2
  AND DATE_PART('day', datetime) = $3
ORDER BY datetime, id
`

func build_search(query string) (string, []interface{}) {
	keywords := strings.Split(query, " ")
	conds := make([]string, len(keywords))
	keywords_ifce := make([]interface{}, len(keywords)) // D D Z J

	for i, k := range keywords {
		conds[i] = fmt.Sprintf("content ~~ $%d", i+1)
		keywords_ifce[i] = fmt.Sprintf("%%%s%%", k)
	}

	stmt := fmt.Sprintf(_STMT_SEARCH, strings.Join(conds, " AND "))
	return stmt, keywords_ifce
}

func NewDB(dbname, dbuser, dbpwd string) (*DBInstance, error) {
	src := "dbname=" + dbname
	if dbuser != "" {
		src += " user=" + dbuser
	}
	if dbpwd != "" {
		src += " password=" + dbpwd
	}
	src += " sslmode=disable"

	sqldb, err := sql.Open("postgres", src)
	if err != nil {
		return nil, err
	}

	return &DBInstance{sqldb: sqldb}, nil
}

var dates = 1600

func (db *DBInstance) Dates() ([][]int, error) {
	ret := make([][]int, 0, dates+10)

	row, err := db.sqldb.Query(_STMT_DATE)
	if err != nil {
		return nil, err
	}

	i := 0
	for row.Next() {
		date := make([]int, 3)
		err = row.Scan(&date[0], &date[1], &date[2])
		if err != nil {
			return nil, err
		}
		ret = append(ret, date)
		i += 1
	}

	dates = i
	return ret, nil
}

type message struct {
	id int
	msgtype,
	sender,
	content string
	datetime []int
}

func (db *DBInstance) Messages(year, month, day int) ([]message, error) {
	ret := make([]message, 0, 100)

	row, err := db.sqldb.Query(_STMT_MSG, year, month, day)
	if err != nil {
		return nil, err
	}

	for row.Next() {
		var (
			id int
			msgtype,
			sender,
			content string
			hour,
			minute,
			second float64
		)
		err = row.Scan(&id, &msgtype, &sender, &content,
			&hour, &minute, &second)
		if err != nil {
			return nil, err
		}

		time := make([]int, 3)
		time[0] = int(hour)
		time[1] = int(minute)
		time[2] = int(second)
		ret = append(ret, message{
			id:       id,
			msgtype:  msgtype,
			sender:   sender,
			content:  content,
			datetime: time,
		})
	}

	return ret, nil
}

func (db *DBInstance) Search(query string) ([]message, error) {
	ret := make([]message, 0)
	stmt, keywords := build_search(query)

	if len(keywords) == 0 {
		return ret, nil
	}

	prep_stmt, err := db.sqldb.Prepare(stmt)
	if err != nil {
		return nil, err
	}
	row, err := prep_stmt.Query(keywords...)
	if err != nil {
		return nil, err
	}

	for row.Next() {
		var (
			id int
			msgtype,
			sender,
			content string
			year,
			month,
			day,
			hour,
			minute,
			second float64
		)

		err = row.Scan(&id, &msgtype, &sender, &content,
			&year, &month, &day,
			&hour, &minute, &second)
		if err != nil {
			return nil, err
		}

		datetime := make([]int, 6)
		datetime[0] = int(year)
		datetime[1] = int(month)
		datetime[2] = int(day)
		datetime[3] = int(hour)
		datetime[4] = int(minute)
		datetime[5] = int(second)
		ret = append(ret, message{
			id:       id,
			msgtype:  msgtype,
			sender:   sender,
			content:  content,
			datetime: datetime,
		})
	}

	return ret, nil
}

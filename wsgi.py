import flask
import json
import psycopg2
import html

with open("config.json") as f:
    config = json.load(f)

app = flask.Flask(__name__)
app.jinja_env.line_statement_prefix = '#'
app.jinja_env.line_comment_prefix = '///'

@app.route("/")
def index():
    return flask.render_template("index.tmpl")

@app.route("/c_lang_cn/")
def list_years():
    cnx = psycopg2.connect(**config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT DATE_PART('year', datetime) as year FROM message GROUP BY year ORDER BY year")

    ret = ""
    for year, in cursor:
        ret += '<a href="{0}/">{0}/</a><br>'.format(int(year))

    return '<!DOCTYPE html><head><title>c_lang_cn</title><body>{}</body></html>'.format(ret)

@app.route("/c_lang_cn/<year>/")
def list_files(year):
    cnx = psycopg2.connect(**config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT DISTINCT DATE_PART('month', datetime) as month, DATE_PART('day', datetime) as day FROM message "
                   "WHERE DATE_PART('year', datetime) = %s ORDER BY month, day", (year, ))
    
    ret = ""
    for month, day in cursor:
        ret += '<a href="{month:02d}-{day:02d}.txt">{month:02d}-{day:02d}.html</a><br>'.format(month=int(month), day=int(day))

    cnx.close()
    return "<!DOCTYPE html><head><title>{}</title></head><body>{}</body></html>".format(int(year), ret)

@app.route("/c_lang_cn/<year>/<month>-<day>.txt")
def show_content(year, month, day):
    cnx = psycopg2.connect(**config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT id, sender, datetime, type, content FROM message "
                   "WHERE DATE_PART('year', datetime) = %s AND DATE_PART('month', datetime) = %s AND DATE_PART('day', datetime) = %s "
                            "ORDER BY datetime, id", (year, month, day))

    ret = flask.render_template("content.tmpl", cursor = cursor, year = year, month = month, day = day)
    cnx.close()
    return ret

@app.route("/search")
def search():
    query_string = flask.request.args.get('s')

    cursor = None
    cnx = psycopg2.connect(**config["database"])
    if query_string:
        try:
            cursor = cnx.cursor()
            cursor.execute("SELECT id, datetime, sender, "
                           "pgroonga_highlight_html(content, pgroonga_query_extract_keywords(%s)) FROM message "
                           "WHERE type = 'PRIVMSG' AND content &@~ %s "
                           "ORDER BY datetime DESC", (query_string, query_string))
        except:
            cnx.close()
            raise
        
        title = "{} - Search".format(html.escape(query_string))
    else:
        query_string = ""
        title = "Search"
        
    ret = flask.render_template('search.tmpl', cursor=cursor, query_string=query_string, title=title)
    cnx.close()
    return ret

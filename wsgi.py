import flask
import json
import psycopg2

with open("config.json") as f:
    config = json.load(f)

app = flask.Flask(__name__)

@app.route("/")
def index():
    return '<!DOCTYPE html><head><title>Index</title></head><body><a href="c_lang_cn/">c_lang_cn/</a></body></html>'

@app.route("/c_lang_cn/")
def list_years():
    cnx = psycopg2.connect(**config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT DISTINCT DATE_PART('year', datetime) as year FROM message ORDER BY year")

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
        ret += '<a href="{month:02d}-{day:02d}.txt">{month:02d}-{day:02d}.txt</a><br>'.format(month=int(month), day=int(day))

    cnx.close()
    return "<!DOCTYPE html><head><title>{}</title></head><body>{}</body></html>".format(int(year), ret)

@app.route("/c_lang_cn/<year>/<month>-<day>.txt")
def show_content(year, month, day):
    cnx = psycopg2.connect(**config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT sender, datetime, type, content FROM message "
                   "WHERE DATE_PART('year', datetime) = %s AND DATE_PART('month', datetime) = %s AND DATE_PART('day', datetime) = %s "
                            "ORDER BY datetime, id", (year, month, day))

    ret = ""
    for sender, datetime, msgtype, message in cursor:
        content = ""
        if msgtype == "ACTION":
            content = "* {} {}".format(sender, message)
        elif msgtype == "PRIVMSG":
            content = "{}: {}".format(sender, message)
        elif msgtype == "JOIN":
            content = "{} joined channel".format(sender)
        elif msgtype == "PART":
            content = "{} left channel".format(sender)
        elif msgtype == "QUIT":
            content = "{} quit".format(sender)

        ret += "{:02d}:{:02d} {}\n".format(datetime.hour, datetime.minute, content)
    
    cnx.close()
    response = flask.make_response(ret)
    response.headers["Content-Type"] = "text/plain"
    return response

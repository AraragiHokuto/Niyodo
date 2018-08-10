import flask
import json
import mysql.connector

with open("config.json") as f:
    config = json.load(f)

app = flask.Flask(__name__)

@app.route("/")
def index():
    return '<!DOCTYPE html><head><title>Index</title></head><body><a href="c_lang_cn/">c_lang_cn/</a></body></html>'

@app.route("/c_lang_cn/")
def list_years():
    cnx = mysql.connector.Connect(pool_name="niyodo", **config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT DISTINCT YEAR(datetime) FROM message")

    ret = ""
    for year, in cursor:
        ret += '<a href="{0}/">{0}/</a>'.format(year)

    return '<!DOCTYPE html><head><title>c_lang_cn</title><body>{}</body></html>'.format(ret)

@app.route("/c_lang_cn/<year>/")
def list_files(year):
    cnx = mysql.connector.Connect(pool_name="niyodo", **config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT DISTINCT MONTH(datetime), DAY(datetime) FROM message "
                            "WHERE YEAR(datetime) = %s ORDER BY datetime, id", (year, ))
    
    ret = ""
    for month, day in cursor:
        ret += '<a href="{month:02d}-{day:02d}.txt">{month}-{day}.txt</a>'.format(month=month, day=day)

    cnx.close()
    return "<!DOCTYPE html><head><title>{}</title></head><body>{}</body></html>".format(year, ret)

@app.route("/c_lang_cn/<year>/<month>-<day>.txt")
def show_content(year, month, day):
    cnx = mysql.connector.Connect(pool_name="niyodo", **config["database"])
    cursor = cnx.cursor()
    cursor.execute("SELECT sender, datetime, type, content FROM message "
                            "WHERE YEAR(datetime) = %s AND MONTH(datetime) = %s AND DAY(datetime) = %s "
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

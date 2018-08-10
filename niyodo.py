import mysql.connector
import datetime
import socket
import json
import re

with open("config.json") as f:
    config = json.load(f)

cnx = mysql.connector.Connect(pool_name = "niyodo", **config["database"])

def connect():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM);
    sock.settimeout(300)
    host, port = config["net"]
    sock.connect((host, port))
    sock.send("NICK {nickname}\r\n"
              "USER moe moe moe :bot\r\n"
              "JOIN {channel}\r\n"
              "PRIVMSG NickServ :identify {password}\r\n".format(**config["user"]).encode())
    return sock

PINGRE = re.compile("^PING(.*)")
MSGRE = re.compile(":([a-zA-Z0-9_\-\\\[\]{}^|]+)![^ ]+ ([A-Z]+) {} *:?(.*)".format("{}", config["user"]["channel"]))
QUITRE = re.compile(":([a-zA-Z0-9_\-\\\[\]{}^|]+)![^ ]+ QUIT *:?(.*)")
ACTIONRE = re.compile("[^ ]*ACTION[^ ]* (.*)\x01")

def on_recv(sock, message):
    print(message)
    
    now = datetime.datetime.now()

    match = PINGRE.match(message)
    if match:
        sock.send("{}\r\n".format(match.group(1)).encode())
        return

    sender, msgtype, msgcontent = "", "", ""

    match = QUITRE.match(message)
    if match:
        sender, msgcontent = match.groups()
        msgtype = "QUIT"

    match = MSGRE.match(message)
    if match:
        sender, msgtype, msgcontent = match.groups()
        
        action_match = ACTIONRE.match(msgcontent)
        if msgtype == "PRIVMSG" and action_match:
            msgtype = "ACTION"
            msgcontent = action_match.group(1)

    if not match:
        return

    print(sender, msgtype, msgcontent)
    
    cursor = cnx.cursor()
    cursor.execute("INSERT INTO message (type, sender, datetime, content) VALUES (%s, %s, %s, %s)",
                   (msgtype, sender, now, msgcontent))
    cnx.commit()

if __name__ == "__main__":
    while True:
        sock = connect()

        while True:
            try:
                msg = b""
                while b"\r\n" not in msg:        
                    msg += sock.recv(4096)
            except OSError:
                break
            
            on_recv(sock, msg.decode().strip())

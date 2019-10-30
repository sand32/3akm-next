3akm-next
=========

The next iteration of the site for the 3AKM LAN party.

This is a project written using NodeJS and ExpressJS for a backend API along with a client written using AngularJS with bundling and minification provided by browserify.

Behind the scenes, this application utilizes LDAP to communicate with an Active Directory instance to manage users (an externally-provided requirement). It also communicates with multiple services hosted alongside the app: Teamspeak via telnet and a Call of Duty 4 server via UDP.

No extraneous build tools are required to prepare the site for operation: provided you meet the environmental prerequisites, simply pull the dependencies via npm and run it.

Prerequisites
-------------
* Node.js
* MongoDB

Setup
-----
1. git clone https://github.com/sand32/3akm-next.git
2. cd 3akm-next
3. npm install
4. node app.js

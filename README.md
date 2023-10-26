# Stylus Logger

This is a web app designed to log data from a to digital stylus device such as the Logitech Crayon,  Apple pencil, Microsoft Surface Pen, etc.

To setup, first install [nodejs](https://nodejs.org/en/download) on your system.
Then install the required dependencies:

```bash
cd app
npm install
```

Run the server using this command:

```bash
npm run dev
```

Open the app with Chrome browser using the IP of your system. Your IP will be shown when the server starts successfully:

```bash
npm run dev

> stylus_logger@1.0.0 dev
> node index.js

Websocket server listening on :3030
Stylus logger running on 172.21.79.167 3000 

#For this example, the corresponding URL is: http://172.21.79.167:3000
```

Stylus data is logged as a json array. Files are saved in the folder: `app/public_html/data`

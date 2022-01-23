## [3.0.1] - 2022-01-23

- The ejs function now merges the ejs parameters. This allows the middleware to add ejs parameters. However if you want to set the ejs parameters you can use the setEjs() function
- openAutomatically option. When this option is true your website will be automatically open at the startup of your application in your browser (only in dev mode)

## [3.0.0] - 2022-01-23

- OneSide no longer uses Express. It now has its own http server. This allows to optimize the performance of OneSide because Express is a rather heavy framework and also it allows to have cleaner and understandable classes.
- 404 endpoint. You can redirect the request to the 404 endpoint with next.notFound()
- Auto route with the route folder. All the .js files in the route folder that return a Router class will be automatically added to the list of endpoint of the sever.
- Page tag. The tag will be replaced by the html of your page. It's usefull if you want to put all your pages in a div in the base file.
- Reload paths option. When a file change in one of this folders the website will be refreshed and the app will not restart.

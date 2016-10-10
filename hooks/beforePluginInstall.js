module.exports = function(ctx) {


    var fs = ctx.requireCordovaModule('fs'),
        path = ctx.requireCordovaModule('path');
        //deferral = ctx.requireCordovaModule('q').defer();


    function copyFiles(srcPath, destPath) {
            //console.log("src: "+srcPath+" - dst: "+destPath);
            if (fs.statSync(srcPath).isDirectory()) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath);
                }
                fs.readdirSync(srcPath).forEach(function (child) {
                    copyFiles(path.join(srcPath, child), path.join(destPath, child));
                });
            } else {
                fs.writeFileSync(destPath, fs.readFileSync(srcPath));
            }
    } 


    var projectRoot = ctx.opts.projectRoot;
    var wwwRoot = path.join(projectRoot,"www");
    
    console.log("ProjectRoot: "+projectRoot);
    console.log("wwwRoot: "+wwwRoot);
    
    var pluginRoot = path.resolve(ctx.opts.projectRoot, "plugins", ctx.opts.plugin.id);
    var wwwPlugin = path.resolve(pluginRoot, "www");
    
    var osdebuggerHtml = path.resolve(wwwPlugin,"osdebugger.html");
      
    console.log("Backing up original config.xml");
    var configXml = path.resolve(projectRoot,"config.xml");
    var backupXml = path.resolve(pluginRoot,"config.xml");
    copyFiles(configXml, backupXml);
    
    
    fs.readFile(configXml, 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
       
       
       var xmlString = data;
                       
       xmlString = xmlString.replace(/(content\s*src\s*=\s*)(")(.)+(")/g,"$1"+"$2"+"osdebugger.html"+"$4");
        
        fs.writeFile(configXml, xmlString, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });  
        
       var contentRegex= /content\s*src\s*=\s*(\")(.+)(\")/g; 
       var contentGroups = contentRegex.exec(xmlString);        
       var originalUrl = contentGroups[2];           
        
       // Check OS Default URL
       var hostnameRegex = /preference\s*name\s*=\s*"DefaultHostname"\s*value\s*=\s*(\")(.+)(\")/g;
       var hostnameGroups = hostnameRegex.exec(xmlString);
       var defaultHostname = null;
       
       var appRegex = /preference\s*name\s*=\s*"DefaultApplicationURL"\s*value\s*=\s*(\")(.+)(\")/g;
       var appGroups = appRegex.exec(xmlString);
       var defaultAppUrl = null;
        
       if(hostnameGroups != null && hostnameGroups.length > 2){
           defaultHostname = hostnameGroups[2];
       }
       
       if(appGroups != null && appGroups.length > 2){
           defaultAppUrl = appGroups[2];
       }
       
       if(defaultHostname != null && defaultAppUrl != null){
           originalUrl = "https://"+defaultHostname+"/"+defaultAppUrl+"/";
       } 
       
       console.log("Original URL: "+originalUrl);   
       
       
       fs.readFile(osdebuggerHtml, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            var htmlString = data;
            
            htmlString = htmlString.replace(/(a\s*id\s*=\s*"originalURL"\s*href\s*=\s*)(")(.)+(")/g,"$1"+"$2"+originalUrl+"$4");
            
            fs.writeFile(osdebuggerHtml, htmlString, function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
                    
                console.log("Copying OSDebugger files");
                copyFiles(wwwPlugin,wwwRoot); 
            });  
            
       });
        
    
    });
    
    
};

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        //$("#nuovoRifiuto").on("tap", nuovoRifiuto.make);
        
        console.log("into bindEvents");
        $("#openFoto").on("tap", function () {
            navigator.camera.getPicture(app.onCameraSuccess, app.onCameraError, 
                { sourceType: Camera.PictureSourceType.CAMERA, 
                    quality: 60, 
                    mediaType: Camera.MediaType.PICTURE,
                    targetWidth: 1024,
                    targetHeight: 1024 });
        });
    },



    onCameraSuccess: function (imageURI) {


        $("#previewFoto").attr("src", imageURI).css({ width: "auto", height: "200px" });

        $("#captionSearch").text("Foto scattata.");
        
        var retries = 0;
        var clearCache = function () {
            navigator.camera.cleanup();
        };

        var win = function (r) {
            clearCache();
            retries = 0;
            
            //console.log("Code = " + r.responseCode);
            //console.log("Sent = " + r.bytesSent);
            
            console.log("Response = " + r.response);

            var json = JSON.parse(r.response);
            var token = json["token"];
            	
            $("#captionSearch").text("Foto inviata. In attesa di risposta...");
            setTimeout(connectToCloudSight(token), 10000);

            //alert(r.response);
        };

        var fail = function (error) {
            console.log("An error has occurred: Code = " + error.code);
            clearCache();
            alert("Errore durante l'invio della foto, riprovare");
            
            $("#captionSearch").text("Errore.");
        };

        var options = new FileUploadOptions();
        options.fileKey = "image_request[image]";
        options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";
        options.headers = { "Authorization": "CloudSight GZY98-jCvOAvLCn_amlS3w" };
        options.params = { "image_request[locale]": "it-IT" , "image_request[language]":"it"}; // if we need to send parameters to the server request
        var ft = new FileTransfer();
        ft.upload(imageURI, encodeURI("https://api.cloudsightapi.com/image_requests"), win, fail, options);

        $("#captionSearch").text("In attesa di risposta...");

        var connectToCloudSight = function (token) {
            var url = "https://api.cloudsightapi.com/image_responses/" + token;
            cordovaHTTP.get(url,
                {}, { "Authorization": "CloudSight GZY98-jCvOAvLCn_amlS3w" },
                function (response) {
                    // prints 200
                    console.log(response.status);
                    try {
                        response.data = JSON.parse(response.data);
                        
                        if(response.data["status"] == "not completed"){
                            setTimeout(connectToCloudSight(token), 3000);
                            $("#captionSearch").text("Elaborazione in corso, attendere...");
                        } else {
                            //alert("status: " + response.data["status"] + "\nname: " + response.data["name"]);
                            console.log(response.data);
                            $("#captionSearch").text("Suggerimento: " + response.data["name"]);
                        }
                    } catch (e) {
                        alert("Errore durante il parsing JSON, riprovare.");
                        $("#captionSearch").text("Errore.");
                    }
                }, function (response) {
                    // prints 403
                    console.log(response.status);
                    console.log(response.data);
                    //prints Permission denied 
                    console.log(response.error);
                    alert("Errore durante la chiamata al server, riprovare.");
                    $("#captionSearch").text("Errore.");
                });
        };

    },

    onCameraError: function (errorMessage) {
        navigator.notification.alert(errorMessage, function () { }, "Errore durante l'acquisizione della foto");
    },


    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        app.receivedEvent('deviceready');
    },
    
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
    /*
    var nuovoRifiuto = {
        make: function() {
            
        }
    }*/
};

app.initialize();
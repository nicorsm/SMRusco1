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
            console.log("into function");
            navigator.camera.getPicture(app.onCameraSuccess, app.onCameraError, { sourceType: Camera.PictureSourceType.CAMERA, quality: 60, mediaType: Camera.MediaType.PICTURE });
        });
    },

    onCameraSuccess: function (imageURI) {


        $("#previewFoto").attr("src", imageURI).css({ width: "128px", height: "128px" });

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

            var token = r.response["token"];

            setTimeout(function () {
                cordovaHTTP.post("https://api.cloudsightapi.com/image_responses/" + token, 
                    {}, { "Authorization": "CloudSight GZY98-jCvOAvLCn_amlS3w" }, 
                    function (response) {
                    // prints 200
                    console.log(response.status);
                    try {
                        response.data = JSON.parse(response.data);
                        // prints test
                        console.log(response.data.message);
                        alert(response.data["name"]);
                    } catch (e) {
                        console.error("JSON parsing error");
                        alert("error parsing");
                    }
                }, function (response) {
                    // prints 403
                    console.log(response.status);

                    //prints Permission denied 
                    console.log(response.error);
                        alert("error response");
                });



        }, 10000);

        alert(r.response);

        alert('Done!');
    };

    var fail = function (error) {
        console.log("An error has occurred: Code = " + error.code);
        clearCache();
        alert('Ups. Something wrong happens!');
    };

    var options = new FileUploadOptions();
    options.fileKey = "image_request[image]";
    options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.headers = { "Authorization": "CloudSight GZY98-jCvOAvLCn_amlS3w" };
    options.params = { "image_request[locale]": "en-US" }; // if we need to send parameters to the server request
    var ft = new FileTransfer();
    ft.upload(imageURI, encodeURI("http://api.cloudsightapi.com/image_requests"), win, fail, options);

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
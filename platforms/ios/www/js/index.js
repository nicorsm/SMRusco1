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
        var watchID = null; //var for watch the geoposition
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
        
        //setTimeout( function() {
         $.getJSON("http://nicola.giancecchi.com/dev/smrusco/rifiuti.json", function(rows) {
            console.log(rows);
            $.each(rows, function (i, item) {
                $('ul').append('<li>' + item[1] + '</li>');
            });
            $("#listViewRifiuti").listview("refresh");
        });
        
        //}, 15000);
        
        // @ PAGO: un elenco dei punti di raccolta è disponibile su http://nicola.giancecchi.com/dev/smrusco/puntiraccolta.json
        // usa l'esempio qui sopra dei rifiuti. il file è strutturato con i campi: ID, latitudine, longitudine, nome della via.
        // per ora i bidoni sono tutti dello stesso tipo (sono isole ecologiche, ci sono tutti i bidoni disponibili)

    },
    
    
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        console.log("deviceReady")
        
        app.receivedEvent('deviceready');
        document.addEventListener("backbutton", function () {}, false );  //for intercept back buttons on android.
        // Throw an error if no update is received every 30 seconds
        var options = { timeout: 30000 };
        watchID = navigator.geolocation.watchPosition(app.onSuccess, app.onError, options);
        $("#positionNow").css({ "text-align": "center" });
        var div = document.getElementById("mappa");

        var map ;
        // Initialize the map view
        map = plugin.google.maps.Map.getMap(div);

        map.on(plugin.google.maps.event.MAP_READY, app.onMapReady);
        // Wait until the map is ready status.
        //map.addEventListener(plugin.google.maps.event.MAP_READY, app.onMapReady);
    },

    //when map is visible
    onMapReady: function(){

    },
    
    //the device can know the position
    onSuccess: function(position) {
             console.log(position);
             $("#positionNow").text(position.coords.latitude);
    },

    //when device can t know position
    onError: function(error) {

            var messaggio = "";

            switch (error.code) {

                case 1://PositionError.PERMISSION_DENIED:
                    messaggio = "L'applicazione non è autorizzata all'acquisizione della posizione corrente";
                    break;

                case 2://PositionError.POSITION_UNAVAILABLE:
                    messaggio = "Non è disponibile la rilevazione della posizione corrente";
                    break;

                case 3://PositionError.TIMEOUT:
                    messaggio = "Non è stato possibile rilevare la posizione corrente";
                    break;
            }

            navigator.notification.alert(messaggio, function() {}, "Avviso");
    },

    onCameraSuccess: function (imageURI) {

        console.log(imageURI);
        $("#previewFoto").attr("src", imageURI + "?ts=" + new Date().toTimeString).css({ width: "auto", height: "200px" });

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
            setTimeout(connectToCloudSight(token), 5000);

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


    
    // Update DOM on a Received Event
    receivedEvent: function (id) {
       try{
            var parentElement = document.getElementById(id);
               var listeningElement = parentElement.querySelector('.listening');
               var receivedElement = parentElement.querySelector('.received');

               listeningElement.setAttribute('style', 'display:none;');
               receivedElement.setAttribute('style', 'display:block;');

               console.log('Received Event: ' + id);
       }catch(err){};

    }
    /*
    var nuovoRifiuto = {
        make: function() {
            
        }
    }*/
    
    
    
};

app.initialize();
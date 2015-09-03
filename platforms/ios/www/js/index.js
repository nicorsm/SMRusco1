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

var rifiuti;
var tipoRifiutoScelto = "";
var tipoRifiutoPrecedente = "";
var bidonePrecedente = new Array(2);

var app = {
    
storage:window.localStorage,
    
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
    var map = null; //var contains map
    var myPositionMark = null;  //var contains LatLng of my position
    var nearTrashMark = null;    //var contains LatLng of the nearest trash
    var exitForNavigation = false; //flag that indicate if user was exit from application for navigation
    console.log("into bindEvents");
    $("#openFoto").on("tap", function () {
                      navigator.camera.getPicture(app.onCameraSuccess, app.onCameraError,
                                                  { sourceType: Camera.PictureSourceType.CAMERA,
                                                  quality: 60,
                                                  mediaType: Camera.MediaType.PICTURE,
                                                  targetWidth: 1024,
                                                  targetHeight: 1024 });
                      
                      });
    
    //document.getElementById("buttonStat").onClick=app.carica();
    
    $("#demo").on("tap", function(){ 
            app.demo(); 
            });

    //setTimeout( function() {
    $.getJSON("https://rawgit.com/nicorsm/SMRusco1/master/rifiuti.json", function(rows) {
              rifiuti=rows;
              console.log(rifiuti);
              var index=0;
              $.each(rifiuti, function (i, item) {
                     //   $('ul').append('<li value='+index+' >' + item[1] + '</li>');
                     
                     $('ul').append('<li><a href="#mappaBidoni" style="text-decoration:none">' + item[1] + '</a></li>');
                     
                     index++;
                     });
              
              
              $("#listViewRifiuti").listview("refresh");
              
              });
    
    $("#listViewRifiuti").on('click', ' > li', function () {
                             var selected_index = $(this).index();
                             tipoRifiutoScelto = rifiuti[selected_index][2];
                           //  alert(tipoRifiutoScelto);
                             });
    
    $("#buttonStat").on('tap',app.carica());
    
    // }, 25000);
    
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
    
    
    // Initialize the map view
    map = plugin.google.maps.Map.getMap(div);
    map.setMapTypeId(plugin.google.maps.MapTypeId.ROADMAP);
    map.on(plugin.google.maps.event.MAP_READY, app.onMapReady);
    map.setMyLocationEnabled(true);
    
    /*  $("li").on("tap" ,function (event) {
     
     
     navigator.notification.alert(this.innerHTML);
     });*/
    
},
    
    //when map is visible
onMapReady: function(){
    
    var onSuccess = function(location) {
        
        var request = {
            'position': location.latLng
        };
        //get the name of the location with reverse geocoder
        plugin.google.maps.Geocoder.geocode(request, function(results) {
                                            if (results.length) {
                                            var result = results[0];
                                            var position = result.position;
                                            var address = [
                                                           result.subThoroughfare || "",
                                                           result.thoroughfare || "",
                                                           result.locality || "",
                                                           result.postalCode || "",
                                                           result.country || ""].join(", ");
                                            
                                            var msg = ["Mia Posizione:\n",
                                                       "indirizzo: " + address].join("\n");
                                            myPositionMark = location.latLng;
                                            map.addMarker({
                                                          'position': location.latLng,
                                                          'title': msg,
                                                          'icon' : 'blue'
                                                          }, function(marker) {
                                                          marker.showInfoWindow();
                                                          });
                                            $("#positionNow").text(address);
                                            
                                            } else {
                                            alert("Not found");
                                            }
                                            });
        
        var markNearLatLng = null;
        var markNearTitle = null;
        var minDistance = 10000000;  //10k km
        //get trash from database
        $.getJSON("http://nicola.giancecchi.com/dev/smrusco/puntiraccolta.json", function(rows) {
                  $.each(rows, function (i, item) {
                         var temp = app.distanceBetweenTwoMarker(location.latLng.lat, location.latLng.lng, item[1], item[2]);
                         var latLng = new plugin.google.maps.LatLng(item[1],item[2]);
                         if(minDistance > temp){
                         minDistance = temp;
                         markNearLatLng = latLng;
                         markNearTitle = item[3];
                         }
                         map.addMarker({
                                       'position': latLng,
                                       'title': item[3]
                                       }, function(marker) {
                                       marker.showInfoWindow();
                                       });
                         });
                  nearTrashMark = markNearLatLng;
                  //the trash nearest
                  map.addMarker( {
                                'position' : markNearLatLng,
                                'title' : markNearTitle,
                                'icon' : 'yellow'
                                }, function(marker) {
                                marker.showInfoWindow();
                                });
                  
                  });
        
        map.moveCamera({
                       'target': location.latLng,
                       'zoom': 17,
                       'tilt': 30
                       }, function() {
                       var mapType = plugin.google.maps.MapTypeId.ROADMAP;
                       map.setMapTypeId(mapType);
                       map.showDialog();
                       });
        
    };
    
    var onError = function(msg) {
        alert("error: " + msg);
    };
    map.getMyLocation(onSuccess, onError);
    $("#fullScreen").on("tap", function () {
                        map.showDialog();
                        });
    $("#nearest").on("tap", function () {
                     if (confirm("Vuoi navigare al bidone più vicino?")) {
                     plugin.google.maps.external.launchNavigation({
                                                                  "from": myPositionMark,
                                                                  "to": nearTrashMark
                                                                  });
                     exitForNavigation = true; //set flag navigation
                     }
                     });
    $("#refreshMap").on("tap", function () {
                        app.resetAll();
                        
                        });
},
    
    //the device can know the position
onSuccess: function(position) {
    try{
        if( position.coords.latitude == nearTrashMark.lat && position.coords.longitude == nearTrashMark.lng
           && exitForNavigation ){
            //ecco qui aldo puoi metter il codice per assegnare i punti
            
            tipoRifiutoPrecedente=app.storage.getItem("tipoRifiutoPrecedente");
            
            var stringaCoordinate=app.storage.getItem("bidonePrecedente");
            bidonePrecedente=JSON.parse(stringaCoordinate);
            
            
            //controllo se il bidone è diverso dal precedente o se il rifiuto è di tipo diverso dal precedente se si salvo punteggio
            if(bidonePrecedente==null || (bidonePrecedente[0]!=nearTrashMark.lat && bidonePrecedente[1]!=nearTrashMark.lng)|| tipoRifiutoPrecedente!=tipoRifiutoScelto){
                
                
                app.salvaPunti(tipoRifiutoScelto);
                
                
            }else{
                //notifico che il punto non è stato assegnato e perche'
                alert("Nessun punto guadagnato, bidone utilizzato precedentemente o stessa tipologia di rifiuto precedente");
            }
            
            
            
            
            //in entrambi i casi salvo la tipologia del rifiuto corrente e del bidone corrente
            
            app.storage.setItem("tipoRifiutoPrecedente",tipoRifiutoScelto);
            
            var arrayCoordinate=new Array(nearTrashMark.lat,nearTrashMark.lng);
            
            app.storage.setItem("bidonePrecedente",JSON.stringify(arrayCoordinate));
            console.log("Hai Raggiunto Il Bidone più Vicino!");
            
        }
        
    }catch(error){
        console.log(error.message);
    }
    
},

carica:  function(){
    
    var numCarta = app.storage.getItem("carta");
    var numPlastica = app.storage.getItem("plastica");
    var numVetro = app.storage.getItem("vetro");
    var numUmido = app.storage.getItem("umido");
    var numIndifferenziata = app.storage.getItem("indifferenziata");
    
    var cellaCarta=document.getElementById("numCarta");
    var cellaPlastica=document.getElementById("numPlastica");
    var cellaVetro=document.getElementById("numVetro");
    var cellaUmido=document.getElementById("numUmido");
    var cellaIndifferenziata=document.getElementById("numIndifferenziata");
    
    var cellaBadgeCarta=document.getElementById("badgeCarta");
    var cellaBadgePlastica=document.getElementById("badgePlastica");
    var cellaBadgeVetro=document.getElementById("badgeVetro");
    var cellaBadgeUmido=document.getElementById("badgeUmido");
    var cellaBadgeIndifferenziata=document.getElementById("badgeIndifferenziata");
    
    var totale=0;
    
    arrayPunteggi = new Array(numCarta,numPlastica,numVetro,numUmido,numIndifferenziata);
    arrayCelle=new Array(cellaCarta,cellaPlastica,cellaVetro,cellaUmido,cellaIndifferenziata);
    arrayCelleBadge=new Array(cellaBadgeCarta,cellaBadgePlastica,cellaBadgeVetro,cellaBadgeUmido,cellaBadgeIndifferenziata);
    
    for (var i=0; i < 5; i++){
        if(arrayPunteggi[i]==null){
            arrayCelle[i].innerHTML = 0;
        }else{
            arrayCelle[i].innerHTML=arrayPunteggi[i];
            totale=totale+parseInt(arrayPunteggi[i]);
        }
        
        if(arrayPunteggi[i]<5 || arrayPunteggi==null){
            arrayCelleBadge[i].innerHTML="/";
            
        }else{
            arrayCelleBadge[i].innerHTML="<img src='img/trash.png' height='42' width='42'/>";
            
        }
    }
    
    document.getElementById("totale").innerHTML=totale;
    
    
},
    
    
demo:function(){
    
            
            tipoRifiutoPrecedente=app.storage.getItem("tipoRifiutoPrecedente");
            
            var stringaCoordinate=app.storage.getItem("bidonePrecedente");
            bidonePrecedente=JSON.parse(stringaCoordinate);
            //controllo se il bidone è diverso dal precedente o se il rifiuto è di tipo diverso dal precedente se si salvo punteggio
            if(bidonePrecedente==null || tipoRifiutoPrecedente!=tipoRifiutoScelto){
                app.salvaPunti(tipoRifiutoScelto);
            }else{
                //notifico che il punto non è stato assegnato e perche'
                alert("Nessun punto guadagnato, bidone utilizzato precedentemente o stessa tipologia di rifiuto precedente");
            }
            //in entrambi i casi salvo la tipologia del rifiuto corrente e del bidone corrente
            
            app.storage.setItem("tipoRifiutoPrecedente",tipoRifiutoScelto);
            
            var arrayCoordinate=new Array(nearTrashMark.lat,nearTrashMark.lng);
            
            app.storage.setItem("bidonePrecedente",JSON.stringify(arrayCoordinate));
            console.log("Hai Raggiunto Il Bidone più Vicino!");
            
            
    //$("#more").remove();
    //$("#updates").append(htmldat).listview('refresh');
    ///$("#more").trigger('create');
    $("#demo").off('tap');//.on('click', function(){});
    
},
    
salvaPunti:  function(tipologia){
    
    //scrivo la tipologia (come chiave) e incremento il punteggio e salvo
    //visualizzo alert che notifica punto assegnato e categoria + se ho ottenuto un badge
    
    var valore=app.storage.getItem(tipologia);
    
    if(valore==null){
        valore=0;
    }
    
    valore=parseInt(valore)+1;
 
    switch (tipologia) {
        case "CARTA":
            app.storage.setItem("carta",valore);
            break;
        case "PLASTICA" :
            app.storage.setItem("plastica",valore);
            break;
        case "VETRO" :
            app.storage.setItem("vetro",valore);
            break;
        case "UMIDO" :
            app.storage.setItem("umido",valore);
            break;
        default:
            app.storage.setItem("indifferenziata",valore);
            
            
    }
    
            if(valore+1!=5){
                alert("Hai guadagnato 1 punto, rifiuto tipo: "+tipologia);
            }else{
                alert("Hai guadagnato 1 punto e un badge per rifiuti di tipo: "+tipologia);
            }
            
            app.carica();
    
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
    
    //navigator.notification.alert(messaggio, function() {}, "Avviso");
},
    
    //Haversine formula for calculate distance between marker points
distanceBetweenTwoMarker: function (latP1, longP1, latP2, longP2){
    
    var rad = function(x) {
        return x * Math.PI / 180;
    };
    
    var getDistance = function() {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(latP2 - latP1);
        var dLong = rad(longP2 - longP1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(latP1)) * Math.cos(rad(latP2)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };
    return getDistance();
},
    
resetAll:function (){
    console.log("resetAll")
    map.clear();  //clear all markers
    exitForNavigation = false;
    myPositionMark = null;
    nearTrashMark = null;
    
    var onSuccess = function(location) {
        
        var request = {
            'position': location.latLng
        };
        //get the name of the location with reverse geocoder
        plugin.google.maps.Geocoder.geocode(request, function(results) {
                                            if (results.length) {
                                            var result = results[0];
                                            var position = result.position;
                                            var address = [
                                                           result.subThoroughfare || "",
                                                           result.thoroughfare || "",
                                                           result.locality || "",
                                                           result.postalCode || "",
                                                           result.country || ""].join(", ");
                                            
                                            var msg = ["Mia Posizione:\n",
                                                       "indirizzo: " + address].join("\n");
                                            myPositionMark = location.latLng;
                                            map.addMarker({
                                                          'position': location.latLng,
                                                          'title': msg,
                                                          'icon' : 'blue'
                                                          }, function(marker) {
                                                          marker.showInfoWindow();
                                                          });
                                            $("#positionNow").text(address);
                                            
                                            } else {
                                            alert("Not found");
                                            }
                                            });
        
        var markNearLatLng = null;
        var markNearTitle = null;
        var minDistance = 10000000;  //10k km
        //get trash from database
        $.getJSON("https://rawgit.com/nicorsm/SMRusco1/master/puntiraccolta.json", function(rows) {
                  $.each(rows, function (i, item) {
                         var temp = app.distanceBetweenTwoMarker(location.latLng.lat, location.latLng.lng, item[1], item[2]);
                         var latLng = new plugin.google.maps.LatLng(item[1],item[2]);
                         if(minDistance > temp){
                         minDistance = temp;
                         markNearLatLng = latLng;
                         markNearTitle = item[3];
                         }
                         map.addMarker({
                                       'position': latLng,
                                       'title': item[3]
                                       }, function(marker) {
                                       marker.showInfoWindow();
                                       });
                         });
                  nearTrashMark = markNearLatLng;
                  //the trash nearest
                  map.addMarker( {
                                'position' : markNearLatLng,
                                'title' : markNearTitle,
                                'icon' : 'yellow'
                                }, function(marker) {
                                marker.showInfoWindow();
                                });
                  
                  });
        
        map.moveCamera({
                       'target': location.latLng,
                       'zoom': 17,
                       'tilt': 30
                       }, function() {
                       var mapType = plugin.google.maps.MapTypeId.ROADMAP;
                       map.setMapTypeId(mapType);
                       map.showDialog();
                       });
        
    };
    
    var onError = function(msg) {
        alert("error: " + msg);
    };
    map.getMyLocation(onSuccess, onError);
    
    
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
    //navigator.notification.alert(errorMessage, function () { }, "Errore durante l'acquisizione della foto");
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
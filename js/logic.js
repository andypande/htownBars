/*Improvement ideas
-Integrate proximity to other bars ranking back into Search algorithm - DONE!
-After calling bars list once, we do not need to call it again. Cache the results for future searches - DONE! by setting cache = true!
-On click of pictures in Carousel, should navigate to website of the bar - DONE!
-Implement a better loop for showing top 10 bar results. Current loop will break for barsList with less than 10 results - DONE!
-Implement search on clicking Enter still - DONE!
-Add picture links for all bars in barsList.JSON - DONE! 
-Carousel should be ordered too - highest aggregate rating to lowest aggregate rating - DONE!
-Mobile picture size for carousel should be set so all text content can fit - FIXED! - with a little Css magic
-Mobile touches sometimes not reponsive - Make sure touch-punch active and working - DONE! isMobile was not being set correctly
-Add the logo onto the website - DONE!
-Add space between the carousel and the bottom of the screen as Shivan suggested -DONE!
-Show picture at the top instead of the little map for the best bar results - DONE!
-Clicking Google maps link should take user to the bar Url instead of address URl so they can see ratings, pictures etc. - DONE!
-Show map to let user know which area is which, shaded areas for midtown, downtown, heights etc. Will be designed by Shivan. 

-Change size of Icons for Quietness and Value so biggest Icon at beginning and smaller icon at end to indicate to user what these criteria mean better - posted comment on plugin, not sure if possible!

-Possibly add background color?

-Big implementation: Wrap the website into an app using one of these websites http://mashable.com/2013/12/03/build-mobile-apps/#EYpqafiVZqq1 or the website app packaging software
*/
angular.module('houstonBars', ['ngAnimate', 'ui.bootstrap', 'angular-storage', 'angular-jwt', 'ngRoute']);
angular.module('houstonBars').controller('InputController', ['$scope', '$http', function($scope, $http) {
    $scope.userInfo = {};
    $scope.loggedInUserInfo = {};
    $scope.loggedInUserInfo.showClassicMenu = false;
    $scope.loggedInUserInfo.showNewMenu = true;
    $scope.createUser = {};
    $scope.loggedIn = false;
    $scope.totalBarCount = 186;
    $scope.login = function(){
        if($scope.userInfo.username && $scope.userInfo.password){
            $http({
                method: 'GET',
                url: 'api.php/users?transform=1',
                cache: true
            }).success(function(userArray, status){
                var accessGranted = false;
                var userArray = userArray.users;
                for(var i=0; i<userArray.length; i++){
                    if(userArray[i].email === $scope.userInfo.username.toLowerCase() && userArray[i].password === $scope.userInfo.password )
                        {
                            accessGranted = true;
                            $scope.loggedInUserInfo.firstName = userArray[i].firstName;
                            $scope.loggedInUserInfo.lastName = userArray[i].lastName;
                            $scope.loggedInUserInfo.email = userArray[i].email;
                            $scope.loggedInUserInfo.id = userArray[i].id;
                            $scope.loggedInUserInfo.favoriteBars = userArray[i].favoriteBars;
                            $scope.loggedInUserInfo.barsVisited = userArray[i].barsVisited;

                        }
                }

                if(accessGranted){
                        $scope.loggedIn = true;               
                        $("#login-modal").modal('hide');
                }
                else{
                    alert("Please register for an account or re-enter login info and try again.");
                }

            }).error(function(data, status){
                alert("Processing Data Error:" + status);
            });
        }
    }
    $scope.addToFavoritesForUser = function(barName, userInfo){
        var listOfBars;
        if(userInfo.favoriteBars){
            listOfBars = userInfo.favoriteBars + "," + barName;
        }
        else{
            listOfBars = barName;
        }
        $http({
            method: 'PUT',
            url: 'api.php/users/' + userInfo.id,
            data: JSON.stringify({"favoriteBars":listOfBars})
        }).success(function(data, status){
            if(status===200){
                alert(barName + " Favorited.");
            }
            $scope.loggedInUserInfo.favoriteBars = listOfBars;
        }).error(function(data, status){
            alert("Processing Data Error:" + status);
        });
        
    }
    
    $scope.addToVisitedForUser = function(barName, userInfo){
        var listOfBars;
        if(userInfo.barsVisited){
            listOfBars = userInfo.barsVisited + "," + barName;
        }
        else{
            listOfBars = barName;
        }
        $http({
            method: 'PUT',
            url: 'api.php/users/' + userInfo.id,
            data: JSON.stringify({"barsVisited":listOfBars})
        }).success(function(data, status){
            if(status===200){
                alert(barName + " Marked As Visited.");
            }
            $scope.loggedInUserInfo.barsVisited = listOfBars;
        }).error(function(data, status){
            alert("Processing Data Error:" + status);
        });
        
    }
    
    $scope.logOut = function(){
            $scope.loggedIn = false;
            $scope.userInfo = {};
            $scope.loggedInUserInfo = {};
            $scope.loggedInUserInfo.showClassicMenu = false;
            $scope.loggedInUserInfo.showNewMenu = true;
            $(".loginHelper").popover({
            trigger: "click",
            placement: "bottom",
            html: true
            }) 
    }
    
    $scope.createNewUser = function(){
        if($scope.createUser.firstName && $scope.createUser.lastName && $scope.createUser.email && $scope.createUser.password){
            $http({
                method: 'POST',
                url: 'api.php/users',
                data: JSON.stringify($scope.createUser)
            }).success(function(data, status){
                if(status===200){
                        alert("New User record created for " + $scope.createUser.firstName + " " + $scope.createUser.lastName);
                        $scope.createUser = {};
                        $('#signupbox').hide(); 
                        $('#loginbox').show();
                        $("#login-modal").modal('hide');

                }
            }).error(function(data, status){
                alert("Processing Data Error:" + status);
            });
        }
        
    }
    $scope.showName = false;
    $scope.userInput = { barArea: ""}; //user input for text field
    $scope.myInterval = 6500; //how often to rotate slides
    $scope. noWrapSlides = false;
    var slides = $scope.slides = [];
    var currIndex = 0; //Needed for adding slides to the carousel
    var barsListArray = []; 
    var searchCriteriaDOM ={};
    $scope.enterPressed = function(keyEvent){ //Search for bars when Enter/Return key pressed
        if(keyEvent.which === 13) //Enter key
            barResults();
    }
    $scope.barAreas = {
        Midtown: false,
        EaDo: false,
        Heights: false,
        MarketSquare: false,
        Washington: false,
        Montrose: false,
        Rice: false,
        RiverOaks: false
    }
    $scope.showAreas = false;    
    
    
    var barAreasImage = '<img class="barImage" src="img/NeighborhoodGoogMaps.PNG"/>';
		
		$(".barAreaHelper").popover({
			trigger: "click",
			content: barAreasImage,
			html: true,
			placement: "bottom"
		});
        $(".loginHelper").popover({
            trigger: "click",
            placement: "bottom",
            html: true
        })
    

    var barResults = $scope.retrieveBarResults = function(){
        $("#progressModal").modal('show');
        loadUserEnteredPreferences();
        $http({
            method: 'GET',
            url: 'api.php/barsList?transform=1',
            cache: true
        }).success(function(data, status){
            barsListArray = [];
			barsListArray = data.barsList;
            aggrateUserEnteredCriteria();
        }).error(function(data, status){
            alert("Processing Data Error:" + status);
        });        
        $("#searchMenu").css("min-width", $("#adv-search").width());
        $(".dropdown").removeClass("open");
    }
    
    var displayBarInfo = function(){
        var displayhtml = '<h5><ul>';
        var barName = arguments[1];
        var barNameAddress = barName + " Houston, Tx";
        for(var key in arguments[0])
            {
                if(!(key.indexOf("Rating")>-1) && !(key.indexOf("areaToShow")>-1) && !(key.indexOf("Image")>-1)){
                switch(key){
                    case 'PhoneNumber':
                        displayhtml += '<li><strong>'+ key + ': </strong><a href="tel://1-'+arguments[0][key]+'">'+arguments[0][key]+'</a></li>';
                        break;
                    case 'Address':
                        displayhtml += '<li><strong>Address: </strong><a target="_blank" href="http://maps.google.com/?q=' + barNameAddress + '">' + arguments[0][key] + '</a></li>';
                        break;
                    case 'Website':
                    case 'YelpWebsite':
                        displayhtml += '<li><strong>'+ key + ': </strong><a target="_blank" href="'+ arguments[0][key] +'">' + barName + '</a></li>';       
                        break;                    
                    default:
                        displayhtml += '<li><strong>'+ key + ': </strong>' + arguments[0][key] + '</li>';  
                }
                }

            }
        displayhtml += '</h5></ul>';
        return displayhtml;
    }

    var Bar = function(){
        var BarName, Address, PhoneNumber, Website, YelpWebsite, GoogleRating, YelpRating, Description;

    }

    var delay = 100;
    function codeAddress(addressArray){
        var geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(29.7604, -95.3698);
        var myOptions = {
                    zoom: 12,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);        
        for(var x=0; x<addressArray.length; x++){
            geocodeAddress(geocoder, addressArray[x], map);
        }
    }

    var prev_infoWindow = false;
    function geocodeAddress(geocoder, address, map){
      var infoWindow = new google.maps.InfoWindow({
          content: address
      });

       geocoder.geocode({
            'address': address + ", Houston, Tx"
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    animation: google.maps.Animation.DROP
                });
                map.setCenter(results[0].geometry.location);
                google.maps.event.addListener(marker, 'click', (function(marker){
                    return function(){
                        if(prev_infoWindow){
                            prev_infoWindow.close();
                        }
                        prev_infoWindow = infoWindow;
                        map.setZoom(13);
                        map.setCenter(marker.getPosition());
                        infoWindow.open(map, marker);
                    }
                })(marker));
            }
            else {
                 alert('Geocode was not successful for the following reason: ' + status);
            }
        });

    }


    function loadUserEnteredPreferences(){
            $('.checkClass').each(function(){
                        if (this.checked){   									
                            var fieldName = this.id;
                            var fieldValue = "5";
                            searchCriteriaDOM[fieldName] = fieldValue;
                        }
            });

            // Code to utilize with old rating system  
            //$('.rating').each(function(){
            //             if (this.value > 0){   									
            //                 var fieldName = this.id;
            //                 var fieldValue = this.value;
            //                 searchCriteriaDOM[fieldName] = fieldValue;
            //             }
            // });	
    }

    function aggrateUserEnteredCriteria(){
        var areasSelected= [];
        for(var areas in $scope.barAreas){
            if($scope.barAreas[areas]){
                areasSelected.push(areas); //Add areas selected from checkboxes into a list
            }
        }
        if(areasSelected.length>0){
            $scope.showAreas = true;    
        }else{
            $scope.showAreas = false;    
        }
        var favoriteBars = [];

        if($scope.loggedInUserInfo.showFavorites && $scope.loggedIn && $scope.loggedInUserInfo.favoriteBars){ //Logic to handle prioritizing favorites in the list above others
            favoriteBars = $scope.loggedInUserInfo.favoriteBars.split(",");
        }

        
            //if(!$.isEmptyObject(searchCriteriaDOM)){ //Make sure user has actually entered some values
                  $.each(barsListArray, function(barIndex){ //Loop through array of bars
                      var aggregateBarRating = 0;
                      barsListArray[barIndex].aggregateRating = 0;
                      barsListArray[barIndex].areaToShow = false;
                      for(var i=0; i<favoriteBars.length; i++){
                            if(favoriteBars[i]===barsListArray[barIndex].BarName){
                                aggregateBarRating+=15; //add 15 points to aggregate rating to bring the favorites to the top
                            }
                        }
                      if(areasSelected.indexOf(barsListArray[barIndex].Area)>-1) //Check if areas selected from list are the same as user areas selected
                      {
                          barsListArray[barIndex].areaToShow = true;
                      }
                    for(var userInput in searchCriteriaDOM){ //Loop through all properties in the user input searchCriteria
                          if(userInput in barsListArray[barIndex]) //Check if user input rating exists within current bar
                          {
                            aggregateBarRating += searchCriteriaDOM[userInput] * barsListArray[barIndex][userInput];
                          }

                        }
                      barsListArray[barIndex].aggregateRating = aggregateBarRating; //Add new object property based on aggregate rating for each array element
                  });

           // }

            calculateBestBarOption();    
    }

    function calculateBestBarOption(){
        var myBar = new Bar;
        var barWinnerIndex;
        var barRating = 0;
        var barHtml = '';
        var displayArray = [];
        slides = $scope.slides = [];
        var visitedBars = [];
        if($scope.loggedInUserInfo.hideVisited && $scope.loggedIn && $scope.loggedInUserInfo.barsVisited){ //Logic to handle hiding certain visited bars if user selects to do so
            visitedBars = $scope.loggedInUserInfo.barsVisited.split(",");
        }
        var barArrayIndex = barsListArray.length;
        while(barArrayIndex--){
            if(visitedBars.length>0){
                for(var i=0; i<visitedBars.length; i++){
                    if(visitedBars[i]===barsListArray[barArrayIndex].BarName){
                        barsListArray.splice(barArrayIndex, 1); //skip bars that are marked as visited if the user selects they don't wish to view this bar anymore
                    }
                }
            }
            if(barsListArray[barArrayIndex].areaToShow){
                displayArray.push(barsListArray[barArrayIndex]);
            }
        }




        if((displayArray.length == 0)) //If no bars selected, we can set the final display array as the array retrieved initially from DB
            displayArray = barsListArray;

        $.each(displayArray, function(key, bar){ 
            if((bar.aggregateRating > barRating)){   //Bar with the higest rating should be displayed
                barRating = bar.aggregateRating;
                for(var myKey in bar){
                    myBar[myKey] = bar[myKey];
                }   
            }
            else if($.isEmptyObject(searchCriteriaDOM)){
                for(var myKey in bar){
                    myBar[myKey] = bar[myKey];
                }  
            }

        });

        displayArray.sort(function(a,b){ //sorts array with highest aggregate rating at bottom
            return a.aggregateRating - b.aggregateRating;                  
        });
        var barHtml = "<div id='finalWinner'><h3> The Top Houston Bar for you is " + myBar.BarName + "</h3>";
        barHtml+= displayBarInfo(myBar,myBar.BarName);
        //codeAddress(myBar.Address);
        //displayCarousel(displayArray);
        if(document.getElementById("finalWinner") !== null){
            $("#finalWinner").empty();
        }
        $("#barInfo").prepend(barHtml);
        window.scrollTo(0, 0);
        searchCriteriaDOM ={};
        getSlides(displayArray);
        $(".ssk-sticky").show();
        $("#barsList").show();
        if($scope.loggedIn){
          $("#favoriteBar").popover({
			trigger: "hover",
			placement: "top",
            content: "Click to Favorite Bar"
		  });
          $("#visitedBar").popover({
			trigger: "hover",
			placement: "top",
            content: "Click to Mark Bar As Visited"
		  });
        }
        $('#progressModal').modal('hide');


    }
    
    function getSlides(bestResultsArray){
        //Do some logic adjustment for arrays less than length 10
        var slidesToShow = (bestResultsArray.length < 11) ? bestResultsArray.length : 11;
        var mapAddressesArray = [];
        for(var x=bestResultsArray.length-1; x>bestResultsArray.length-slidesToShow; x--){
            slides.push({
                image: bestResultsArray[x].Image,
                BarName: bestResultsArray[x].BarName,
                Area: bestResultsArray[x].Area,
                Description: bestResultsArray[x].Description,
                Website: bestResultsArray[x].Website,
                Address: bestResultsArray[x].BarName + ", Houston, Tx",
                Yelp: bestResultsArray[x].YelpWebsite,
                Phone: bestResultsArray[x].PhoneNumber,
                id: currIndex++
            });
            mapAddressesArray.push(bestResultsArray[x].BarName);   
        }
        setTimeout(function(){
            codeAddress(mapAddressesArray);
        }, 1000);
    }
    
}]);
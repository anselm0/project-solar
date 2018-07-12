//array to hold history of searches to call for ML
var searchHistory = []
var canvasRoute = []

//Google Autocomplete address
var input = document.querySelector('#address')
var options = {
  bounds: geolocate(),
  type: ['address']
}

var geocoder
var map
var heatmap
var zipCode

autocomplete = new google.maps.places.Autocomplete(input, options);
mapboxgl.accessToken = 'pk.eyJ1IjoicG9uY2hvbXMiLCJhIjoiY2pnd3c4dzViMWM2OTMycGRzNHVrcHVpdSJ9.IY4f8LGRJykJgPz9P1AQZw';

geocoder = new google.maps.Geocoder();

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}

//variable "address" created and stored based on user autocomplete input
function searchAddress() {

  var address = document.querySelector('#address').value
  console.log(address)

  d3.select('#roof').style("display","block")

  yourRoof(address)
  getCMAP()

  d3.select('#roofAddress').html("")
  //d3.select('#address').text("")
  document.getElementById("address").value=""



}

//helper function to verify correct roof image
function yourRoof (myAddress) {
  //call the map api with address to verify if its the correct rooftop, use a modal to display
  //capture image data (machine learning) to detect ridge, rake, valley, hips, eave

  //get the lat and lng values from address input using Google Geocode API
  geocoder = new google.maps.Geocoder()
  geocoder.geocode( { 'address': myAddress}, function(results, status) {
      if (status == 'OK') {
        var lat = results[0].geometry.location.lat()
        var lng = results[0].geometry.location.lng()

        var addressArray = myAddress.split(',')



        //check to see if the results has a postal suffix or not to get correct index value for zip code.
        zipIndex = (results[0].address_components[results[0].address_components.length-1].types[0] == "postal_code_suffix") ? results[0].address_components.length-2 : results[0].address_components.length-1

        zipCode = results[0].address_components[zipIndex].long_name

        //console.log(zipIndex)

        d3.select('#roofAddress').append('h5').text(results[0].formatted_address.split(',')[1]+results[0].formatted_address.split(',')[2])
                                 .append('p').text(results[0].formatted_address.split(',')[0])

        getZipData(zipCode)
        getIncomeData(zipCode)
        getBounds(zipCode)

        createMap(lat, lng)


        //bring up the image of the rooftop
        var latlng = new google.maps.LatLng(lat, lng);
        var mapOptions = {
          zoom: 19,
          center: latlng,
          mapTypeId: 'satellite'
        }
        map = new google.maps.Map(document.querySelector('#roof'), mapOptions)
        //map.setTilt(0)

        //click on map to get the address and display
        google.maps.event.addListener(map, 'click', function(event) {
        geocoder.geocode({
          'latLng': event.latLng
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
              //alert(results[0].formatted_address);
              var lat = results[0].geometry.location.lat()
              var lng = results[0].geometry.location.lng()

              //check to see if the results has a postal suffix or not to get correct index value for zip code.
              zipIndex = (results[0].address_components[results[0].address_components.length-1].types[0] == "postal_code_suffix") ? results[0].address_components.length-2 : results[0].address_components.length-1

              zipCode = results[0].address_components[zipIndex].long_name

              d3.select('#roofAddress').html("")

              d3.select('#roofAddress').append('h5').text(results[0].formatted_address.split(',')[1]+results[0].formatted_address.split(',')[2])
                                       .append('p').text(results[0].formatted_address.split(',')[0])

              getZipData(zipCode)
              getIncomeData(zipCode)
              //getBounds(zipCode)

              createMap(lat, lng)
            }
          }
        })
      })

        saveMap(geocoder, mapOptions, map, lat, lng)

      } else {
        alert('Geocode was not successful for the following reason: ' + status)
      }
    })
}

//helper function to store values of searched maps
function saveMap(geocoder, mapOptions, map, lat, lng) {
    var staticMapUrl = "https://maps.googleapis.com/maps/api/staticmap";

    //Set the Google Map Center.
    staticMapUrl += "?center=" + lat + "," + lng;

    //Set the Google Map Size.
    staticMapUrl += "&size=640x480&scale=2";

    //Set the Google Map Type.
    staticMapUrl += "&maptype=satellite";

    //Set the Google Map Zoom.
    staticMapUrl += "&zoom=" + mapOptions.zoom;

    //console.log(staticMapUrl)
    searchHistory.push(staticMapUrl)
    //return staticMapUrl;

}



function getZipData(zip){
  d3.json(`/solar_data/${zip}`)
      .then (function (zipData) {
        d3.select('#zipCodeData').html(zipData.region_name)
        d3.select('#kwData').html(zipData.yearly_sunlight_kwh_total)
        d3.select('#installData').html(zipData.existing_installs_count)
        d3.select('#countData').html(zipData.count_qualified)

  })


}

function getIncomeData(zip){
  d3.json(`/income_data/${zip}`)
    .then (function (incomeData){
        //code goes here for map or whatever
        d3.select('#incomeData').html("$" + incomeData.Avg__Income_H_hold)
        d3.select('#popData').html(incomeData.Population)


  })
}

function getBounds(zip){
  d3.json(`/zip_bounds/${zip}`)
  .then (function (zbData) {
    //build the boundary map Here
    coordinates = zbData.geometry_coordinates[0][0]
    //console.log(coordinates)
  })
}

//************************************
//Google close up satelite map image of rooftop
//************************************


/*gKey = "AIzaSyAE2STz1AK1g6tePw4fUL7bAbZLJI9KvC8"
//use Google Geocode to get the lat and lng of address variable
function getLatLng(myAddress) {
  var mapUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" + myAddress.split(' ').join('+') + "&key=" + gKey

  var lat = mapUrl.results
  console.log(lat)
};*/

// Create the Main Google Map…

function createMap(lat, lng) {
  map = new google.maps.Map(d3.select("#mainMap").node(), {
    zoom: 12,
    center: {lat: lat, lng: lng},
    mapTypeId: google.maps.MapTypeId.TERRAIN
  })
  //click on map to get the address and display
  google.maps.event.addListener(map, 'click', function(event) {
  geocoder.geocode({
    'latLng': event.latLng
  }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      if (results[0]) {
        //alert(results[0].formatted_address);
        d3.select('#roofAddress').html("")

        yourRoof(results[0].formatted_address)
      }
    }
  })
})

  var gradient = ['rgb(255,255,255)','rgb(254,204,92)','rgb(253,141,60)','rgb(240,59,32)','rgb(189,0,38)']

  heatmap = new google.maps.visualization.HeatmapLayer({
    data: getHeatData(),
    map: map,
    dissipating: false,
    radius: 1,
    //maxIntensity: .01,
    gradient: gradient
  });
}

function getHeatData() {
  //d3.json('solar_data').then....
  //weight is kw_total/1000 = watts total
  return [
      {location: new google.maps.LatLng(32.79197373870968, -96.77335365161295), weight: 0.104},
      {location: new google.maps.LatLng(32.79380971194913, -96.74774204203024), weight: 32.015},
      {location: new google.maps.LatLng(32.74853684648986, -96.84095045707755), weight: 83.8535},
      {location: new google.maps.LatLng(32.84730878333634, -96.82534095110674), weight: 41.0185},
      {location: new google.maps.LatLng(32.77006435425316, -96.74545123899068), weight: 22.4125},
      {location: new google.maps.LatLng(32.758409428350944, -96.76336172768488), weight: 87.399},
      {location: new google.maps.LatLng(33.57035676453089, -101.85879329607721), weight: 32.379},
      {location: new google.maps.LatLng(32.74298968178439, -96.80480941191912), weight: 49.25675},
      {location: new google.maps.LatLng(32.73584419991734, -96.88471416724143), weight: 178.0655},
      {location: new google.maps.LatLng(32.708995841224315, -96.7969812150993), weight: 147.62875},
      {location: new google.maps.LatLng(30.543217358335532, -95.44766829381093), weight: 1.1015},
      {location: new google.maps.LatLng(30.28948663805538, -95.85431834307795), weight: 0.10875},
      {location: new google.maps.LatLng(32.83735982598124, -96.79719341118012), weight: 64.165},
      {location: new google.maps.LatLng(32.78311599685902, -96.87463570327488), weight: 168.018},
      {location: new google.maps.LatLng(32.7143873351976, -96.83982574222756), weight: 92.34725},
      {location: new google.maps.LatLng(32.21110403631667, -94.75794735035515), weight: 0.64725},
      {location: new google.maps.LatLng(32.9301667505238, -97.0947828616032), weight: 216.11975},
      {location: new google.maps.LatLng(33.02422522024071, -97.1016013448327), weight: 63.89975},
      {location: new google.maps.LatLng(32.82765639000819, -96.7487710591804), weight: 93.3635},
      {location: new google.maps.LatLng(32.69352788172414, -97.13474496197318), weight: 49.948},
      {location: new google.maps.LatLng(30.155484923581415, -95.74353063820567), weight: 54.755},
      {location: new google.maps.LatLng(32.82693846945538, -96.77075561463757), weight: 93.72025},
      {location: new google.maps.LatLng(30.442577241654092, -95.43224726936903), weight: 37.57725},
      {location: new google.maps.LatLng(30.28970419824847, -97.71494950334015), weight: 27.49525},
      {location: new google.maps.LatLng(30.310698658337127, -97.72270652956719), weight: 58.40875},
      {location: new google.maps.LatLng(35.20005724308682, -101.79157495196142), weight: 44.58675},
      {location: new google.maps.LatLng(33.03598286491989, -97.05928872375121), weight: 168.6125},
      {location: new google.maps.LatLng(32.86256547898779, -96.79117025040465), weight: 68.59025},
      {location: new google.maps.LatLng(32.75421847873906, -97.13629704067631), weight: 81.132},
      {location: new google.maps.LatLng(32.88990876915313, -97.14876171216001), weight: 87.17725},
      {location: new google.maps.LatLng(32.72325475103438, -97.26988252116632), weight: 87.84225},
      {location: new google.maps.LatLng(30.154054868187387, -95.67058919078383), weight: 16.3535},
      {location: new google.maps.LatLng(32.96956847504829, -96.98236879313035), weight: 217.0805},
      {location: new google.maps.LatLng(32.801569964570135, -96.96031140021839), weight: 116.73425},
      {location: new google.maps.LatLng(32.82830992954426, -96.84661254177584), weight: 148.123},
      {location: new google.maps.LatLng(32.85381117878788, -97.13304252001299), weight: 103.88775},
      {location: new google.maps.LatLng(32.82941972636516, -97.1465715247294), weight: 35.78875},
      {location: new google.maps.LatLng(32.85987201246484, -97.08405916568789), weight: 95.78075},
      {location: new google.maps.LatLng(30.281751556198614, -95.31528031333441), weight: 38.257},
      {location: new google.maps.LatLng(30.062900546752136, -95.1689201936645), weight: 79.264},
      {location: new google.maps.LatLng(33.73263566417851, -96.50319390061216), weight: 24.03975},
      {location: new google.maps.LatLng(32.92503422882482, -96.96590667664084), weight: 218.14525},
      {location: new google.maps.LatLng(33.07520575367714, -97.0556717976808), weight: 121.673},
      {location: new google.maps.LatLng(32.86999490719195, -96.85791263893847), weight: 201.7165},
      {location: new google.maps.LatLng(32.722157464396254, -97.0831705112381), weight: 160.61625},
      {location: new google.maps.LatLng(32.66021438515885, -97.16253924978152), weight: 122.58675},
      {location: new google.maps.LatLng(32.65594003054642, -97.09038821270032), weight: 93.25875},
      {location: new google.maps.LatLng(32.78216622476282, -97.3009038892519), weight: 133.18825},
      {location: new google.maps.LatLng(30.432167239383602, -95.54967600319938), weight: 50.80175},
      {location: new google.maps.LatLng(30.229025683285194, -95.1531200337842), weight: 45.3965},
      {location: new google.maps.LatLng(33.02220060541349, -97.01133554768849), weight: 190.96925},
      {location: new google.maps.LatLng(32.79506835366973, -96.77070308440366), weight: 10.44925},
      {location: new google.maps.LatLng(32.71982360448002, -97.14822307679448), weight: 102.59375},
      {location: new google.maps.LatLng(32.823039552549986, -97.0996838844625), weight: 99.5285},
      {location: new google.maps.LatLng(32.94806413340485, -97.15217260957613), weight: 141.0315},
      {location: new google.maps.LatLng(32.777261743251245, -97.40010801137218), weight: 104.0385},
      {location: new google.maps.LatLng(33.19057019486898, -97.12892608295765), weight: 7.2295},
      {location: new google.maps.LatLng(33.151516000549165, -97.0944399528707), weight: 123.98625},
      {location: new google.maps.LatLng(30.17794836801244, -95.50280189425125), weight: 137.90625},
      {location: new google.maps.LatLng(28.064420121052628, -97.0371607353383), weight: 2.40825},
      {location: new google.maps.LatLng(30.26481670490566, -97.71596480125379), weight: 116.4865},
      {location: new google.maps.LatLng(30.32211721681131, -97.74034860793958), weight: 46.86875},
      {location: new google.maps.LatLng(35.22952148483325, -101.81087275191483), weight: 152.68725},
      {location: new google.maps.LatLng(33.569321389615574, -101.88851280853729), weight: 67.64375},
      {location: new google.maps.LatLng(33.62748538964816, -101.8847875382956), weight: 117.55625},
      {location: new google.maps.LatLng(32.722541437334314, -96.67296180356637), weight: 244.9405},
      {location: new google.maps.LatLng(32.70652069552377, -97.33850388384099), weight: 156.782},
      {location: new google.maps.LatLng(33.192835109785044, -97.06405935915804), weight: 42.323},
      {location: new google.maps.LatLng(29.797624888269144, -95.32957647215014), weight: 148.37425},
      {location: new google.maps.LatLng(29.97643857396933, -95.57629327198033), weight: 211.75475},
      {location: new google.maps.LatLng(30.36044059132936, -95.18462859768853), weight: 45.5725},
      {location: new google.maps.LatLng(30.158226408197915, -95.2000094383829), weight: 80.24425},
      {location: new google.maps.LatLng(29.41469868961795, -98.46158409730063), weight: 28.8415},
      {location: new google.maps.LatLng(29.388180945579403, -98.52461234560084), weight: 49.63775},
      {location: new google.maps.LatLng(33.048692268210935, -96.995667130409), weight: 87.12725},
      {location: new google.maps.LatLng(32.9019710175579, -96.79320127992001), weight: 110.89125},
      {location: new google.maps.LatLng(32.679563381997845, -97.33405331151639), weight: 111.172},
      {location: new google.maps.LatLng(33.902271011503224, -98.49054009936499), weight: 140.586},
      {location: new google.maps.LatLng(29.33296519972524, -94.7575989918839), weight: 179.508},
      {location: new google.maps.LatLng(29.401888558820975, -98.50538279447466), weight: 86.28475},
      {location: new google.maps.LatLng(29.423808861396463, -98.52724455097261), weight: 231.8985},
      {location: new google.maps.LatLng(29.440558817876344, -98.46048948528222), weight: 29.348},
      {location: new google.maps.LatLng(35.20177556020215, -101.88756695297246), weight: 177.413},
      {location: new google.maps.LatLng(31.803544660229218, -106.4573145310535), weight: 95.989},
      {location: new google.maps.LatLng(31.94017312451812, -106.40949077385173), weight: 25.7195},
      {location: new google.maps.LatLng(32.89245941933164, -96.94216037466158), weight: 73.57625},
      {location: new google.maps.LatLng(32.7384119629977, -97.38630764396801), weight: 236.54275},
      {location: new google.maps.LatLng(32.69080839702683, -97.26316734799651), weight: 230.26175},
      {location: new google.maps.LatLng(31.573743503696495, -97.12496222350845), weight: 58.5475},
      {location: new google.maps.LatLng(29.726501016633968, -95.3648681019947), weight: 182.71975},
      {location: new google.maps.LatLng(29.720128494120914, -95.28016320784488), weight: 113.1215},
      {location: new google.maps.LatLng(29.85826400709376, -95.30492236570215), weight: 127.99575},
      {location: new google.maps.LatLng(29.829785348308544, -95.37623494765644), weight: 171.79425},
      {location: new google.maps.LatLng(29.829337889366734, -95.28749652575058), weight: 143.077},
      {location: new google.maps.LatLng(30.07921709865427, -95.81488249268432), weight: 15.55125},
      {location: new google.maps.LatLng(29.506670511634617, -94.98808482776441), weight: 28.71075},
      {location: new google.maps.LatLng(30.11346257238753, -94.12009189564294), weight: 73.04375},
      {location: new google.maps.LatLng(29.46790932993075, -98.52570247823543), weight: 201.59575},
      {location: new google.maps.LatLng(32.67200251672036, -97.02575501917681), weight: 343.8525},
      {location: new google.maps.LatLng(33.18349349500249, -96.9250260381878), weight: 95.681},
      {location: new google.maps.LatLng(33.62878069852805, -96.58081839368367), weight: 188.42325},
      {location: new google.maps.LatLng(29.748574555086034, -95.34359793876519), weight: 120.58},
      {location: new google.maps.LatLng(29.742209673311734, -95.39240974365616), weight: 106.06225},
      {location: new google.maps.LatLng(29.859041975612957, -95.38272632482482), weight: 139.50925},
      {location: new google.maps.LatLng(29.863235729244757, -95.34117317105436), weight: 247.37475},
      {location: new google.maps.LatLng(30.06479797130664, -95.10515368320574), weight: 59.22325},
      {location: new google.maps.LatLng(29.991463654815774, -95.17770875794301), weight: 238.225},
      {location: new google.maps.LatLng(29.702669965819766, -95.19998145099883), weight: 173.9905},
      {location: new google.maps.LatLng(29.738607008025628, -95.24043894769596), weight: 59.494},
      {location: new google.maps.LatLng(29.42154172398007, -98.56616301272078), weight: 169.09125},
      {location: new google.maps.LatLng(30.244383987410902, -97.76531197895336), weight: 228.29625},
      {location: new google.maps.LatLng(35.184995724506294, -101.80253197980012), weight: 66.61175},
      {location: new google.maps.LatLng(32.38624782969348, -99.39464467222228), weight: 13.86025},
      {location: new google.maps.LatLng(32.47040010300626, -100.0083789594572), weight: 22.45275},
      {location: new google.maps.LatLng(31.786212927349204, -106.44176802461905), weight: 78.9785},
      {location: new google.maps.LatLng(31.76786199654468, -106.4275942618259), weight: 140.8655},
      {location: new google.maps.LatLng(32.84778134759874, -96.97310366055079), weight: 185.407},
      {location: new google.maps.LatLng(32.89469632645035, -96.85889207941055), weight: 256.855},
      {location: new google.maps.LatLng(33.441791333333335, -94.12575279372076), weight: 24.21575},
      {location: new google.maps.LatLng(32.74611791507028, -97.21729449841581), weight: 178.557},
      {location: new google.maps.LatLng(32.807408507909244, -97.27204407088489), weight: 223.24475},
      {location: new google.maps.LatLng(33.627092197262215, -97.11092175870137), weight: 127.3695},
      {location: new google.maps.LatLng(29.827577427079202, -95.42665531571407), weight: 209.0685},
      {location: new google.maps.LatLng(27.806360516070352, -97.43767537398419), weight: 33.07075},
      {location: new google.maps.LatLng(27.796060152110684, -97.44469992035947), weight: 132.386},
      {location: new google.maps.LatLng(27.798751952631577, -97.42963034736843), weight: 2.4705},
      {location: new google.maps.LatLng(35.277622472724964, -101.81895388015676), weight: 93.0765},
      {location: new google.maps.LatLng(33.544182252117096, -101.82083253153867), weight: 252.68},
      {location: new google.maps.LatLng(31.824104189709175, -106.38721848154364), weight: 16.53925},
      {location: new google.maps.LatLng(31.76733737769754, -106.29238305632062), weight: 579.15325},
      {location: new google.maps.LatLng(32.968868331770636, -96.74427125244937), weight: 224.493},
      {location: new google.maps.LatLng(32.76585853130449, -96.60562969988408), weight: 360.18975},
      {location: new google.maps.LatLng(32.47121780897069, -94.70107590915065), weight: 167.6515},
      {location: new google.maps.LatLng(29.761593290609248, -95.25734038988685), weight: 308.0505},
      {location: new google.maps.LatLng(29.898809330133325, -95.28013480272003), weight: 20.60625},
      {location: new google.maps.LatLng(29.660163691094375, -95.37128564391165), weight: 99.92275},
      {location: new google.maps.LatLng(29.905326466379947, -95.65713181502834), weight: 304.7915},
      {location: new google.maps.LatLng(29.734989013004732, -95.41207728858257), weight: 91.804},
      {location: new google.maps.LatLng(30.205986588158428, -95.62573531268663), weight: 184.71425},
      {location: new google.maps.LatLng(30.108131737247454, -95.25988139787182), weight: 150.844},
      {location: new google.maps.LatLng(30.199819190621508, -95.54549438058967), weight: 153.1175},
      {location: new google.maps.LatLng(30.086690451354844, -94.12592133800001), weight: 39.159},
      {location: new google.maps.LatLng(29.327758314071925, -98.49936010186133), weight: 160.289},
      {location: new google.maps.LatLng(26.186542599131354, -98.11470695116778), weight: 147.04325},
      {location: new google.maps.LatLng(29.82533140135824, -97.84352679066214), weight: 0.10225},
      {location: new google.maps.LatLng(31.87043656751752, -106.60014266282039), weight: 90.3905},
      {location: new google.maps.LatLng(33.07784092353847, -96.79555807609816), weight: 249.65225},
      {location: new google.maps.LatLng(33.52126365791352, -96.62569514176907), weight: 14.4405},
      {location: new google.maps.LatLng(32.69990917111788, -97.3759326612783), weight: 141.0085},
      {location: new google.maps.LatLng(33.950450913178294, -98.49208980232554), weight: 48.065},
      {location: new google.maps.LatLng(29.854063749623354, -95.44037886482381), weight: 159.827},
      {location: new google.maps.LatLng(30.371407892594934, -95.39014417945151), weight: 114.02},
      {location: new google.maps.LatLng(27.92073416117788, -97.29327831718746), weight: 11.429},
      {location: new google.maps.LatLng(27.802890334475165, -97.68122163227439), weight: 109.94275},
      {location: new google.maps.LatLng(26.17978997272391, -98.18716250382157), weight: 318.32175},
      {location: new google.maps.LatLng(30.15418710056563, -97.60672635402746), weight: 14.06175},
      {location: new google.maps.LatLng(30.289059441906435, -97.6299413952775), weight: 30.684},
      {location: new google.maps.LatLng(30.34989281230787, -97.73169129473366), weight: 158.79275},
      {location: new google.maps.LatLng(32.28068636969309, -99.82370810370846), weight: 8.3715},
      {location: new google.maps.LatLng(31.995914676794147, -102.08315639261765), weight: 271.5965},
      {location: new google.maps.LatLng(33.11286916535901, -96.69973763582836), weight: 241.476},
      {location: new google.maps.LatLng(33.149937401509554, -96.77398606372385), weight: 305.06325},
      {location: new google.maps.LatLng(32.592077442759624, -97.04868567606044), weight: 49.8115},
      {location: new google.maps.LatLng(33.813622589672164, -96.69348721279097), weight: 16.0275},
      {location: new google.maps.LatLng(32.63555182787216, -96.91002550264902), weight: 115.481},
      {location: new google.maps.LatLng(32.668619352329166, -96.78122705051017), weight: 180.29175},
      {location: new google.maps.LatLng(32.71450841494829, -94.7145190352686), weight: 7.163},
      {location: new google.maps.LatLng(31.33311303954278, -94.70188948107852), weight: 162.47125},
      {location: new google.maps.LatLng(31.258381103398783, -94.55021477046829), weight: 11.77325},
      {location: new google.maps.LatLng(31.076465103236895, -97.48659469427447), weight: 217.07775},
      {location: new google.maps.LatLng(29.89317706245382, -95.1882738796956), weight: 179.15625},
      {location: new google.maps.LatLng(29.772452914192396, -95.70436001543942), weight: 67.2905},
      {location: new google.maps.LatLng(30.08580546840816, -95.58472037286387), weight: 289.67975},
      {location: new google.maps.LatLng(30.189603188682963, -95.42752293344836), weight: 166.7915},
      {location: new google.maps.LatLng(29.948759048704638, -95.25510947783967), weight: 216.0915},
      {location: new google.maps.LatLng(29.383665739478964, -95.12897146858721), weight: 47.117},
      {location: new google.maps.LatLng(29.799100830100905, -94.86167759580326), weight: 32.162},
      {location: new google.maps.LatLng(29.661073305120485, -95.2299930752636), weight: 106.47475},
      {location: new google.maps.LatLng(29.889160825825876, -93.97073345298824), weight: 205.761},
      {location: new google.maps.LatLng(26.2814167178314, -98.30967496880236), weight: 186.261},
      {location: new google.maps.LatLng(30.123342795396084, -97.32141886827168), weight: 51.90175},
      {location: new google.maps.LatLng(29.876745104476065, -97.94927475209522), weight: 331.226},
      {location: new google.maps.LatLng(30.185642233383668, -97.7437061201477), weight: 302.9955},
      {location: new google.maps.LatLng(30.206099035641312, -97.79803432643128), weight: 320.22625},
      {location: new google.maps.LatLng(31.840118806734253, -102.41848424985032), weight: 192.9815},
      {location: new google.maps.LatLng(31.878488655582427, -102.43664775751733), weight: 180.911},
      {location: new google.maps.LatLng(33.14626017065367, -96.86511022471161), weight: 575.47725},
      {location: new google.maps.LatLng(33.17639653088593, -96.70348702909313), weight: 319.04575},
      {location: new google.maps.LatLng(32.61957919312943, -96.78641790379734), weight: 146.53525},
      {location: new google.maps.LatLng(32.876743741410856, -96.70958637801027), weight: 220.41775},
      {location: new google.maps.LatLng(32.92064339392641, -96.83776972363911), weight: 176.21325},
      {location: new google.maps.LatLng(32.99844950731345, -96.79449438420353), weight: 119.85475},
      {location: new google.maps.LatLng(32.38718645468374, -94.85839007057194), weight: 157.3575},
      {location: new google.maps.LatLng(32.361215248107776, -95.31082410938922), weight: 246.46275},
      {location: new google.maps.LatLng(32.641364211253865, -97.21132123342852), weight: 66.08975},
      {location: new google.maps.LatLng(32.80449505129962, -97.2100798299262), weight: 153.17625},
      {location: new google.maps.LatLng(32.621193689566624, -97.38360068083286), weight: 151.47925},
      {location: new google.maps.LatLng(32.88113995953064, -97.2121153765841), weight: 163.9405},
      {location: new google.maps.LatLng(29.979247495067014, -95.46551104151698), weight: 135.2845},
      {location: new google.maps.LatLng(29.86047177799198, -95.58592488983808), weight: 564.0815},
      {location: new google.maps.LatLng(29.574593224327742, -95.13265984288668), weight: 139.818},
      {location: new google.maps.LatLng(30.31234263869075, -95.44472667908553), weight: 203.6815},
      {location: new google.maps.LatLng(29.369875864360022, -95.08679219554816), weight: 104.62825},
      {location: new google.maps.LatLng(29.170998299361788, -95.43685880131893), weight: 191.8935},
      {location: new google.maps.LatLng(29.741717359348172, -94.9794584130086), weight: 264.949},
      {location: new google.maps.LatLng(29.278583560628338, -94.82892160402079), weight: 142.553},
      {location: new google.maps.LatLng(29.043132384246444, -95.44373303906136), weight: 180.933},
      {location: new google.maps.LatLng(29.391583914752168, -94.99671293752947), weight: 87.304},
      {location: new google.maps.LatLng(30.381418186621637, -94.17834840932646), weight: 116.86425},
      {location: new google.maps.LatLng(28.768807955897504, -97.00226667440114), weight: 14.664},
      {location: new google.maps.LatLng(29.33116210160848, -98.54019232885008), weight: 112.55475},
      {location: new google.maps.LatLng(29.39135933871403, -98.5527688416367), weight: 117.4945},
      {location: new google.maps.LatLng(27.916481568207747, -97.15472393341632), weight: 93.69125},
      {location: new google.maps.LatLng(29.952072111524828, -98.22671997748222), weight: 4.45225},
      {location: new google.maps.LatLng(33.54998745336072, -101.91752243999257), weight: 99.2285},
      {location: new google.maps.LatLng(31.96179510763661, -102.05033967465906), weight: 248.39375},
      {location: new google.maps.LatLng(31.648186403320764, -106.27906962908621), weight: 23.7595},
      {location: new google.maps.LatLng(32.86652765580498, -96.98307895978766), weight: 119.4645},
      {location: new google.maps.LatLng(32.957432831141, -96.65998848392124), weight: 204.938},
      {location: new google.maps.LatLng(32.59414688961336, -96.86213701628685), weight: 271.15925},
      {location: new google.maps.LatLng(32.63801412720234, -96.54515760582996), weight: 10.266},
      {location: new google.maps.LatLng(32.87572078627688, -96.74508681333656), weight: 111.86},
      {location: new google.maps.LatLng(32.67637277703941, -94.86885155043545), weight: 10.18675},
      {location: new google.maps.LatLng(32.30360269975323, -95.22921740664387), weight: 92.74275},
      {location: new google.maps.LatLng(32.62259618619984, -97.0960327880795), weight: 150.4805},
      {location: new google.maps.LatLng(32.58086259201067, -97.13092063302373), weight: 353.24175},
      {location: new google.maps.LatLng(32.93134898346178, -97.28172096831756), weight: 388.05025},
      {location: new google.maps.LatLng(33.862989230899316, -98.53705094229154), weight: 163.1305},
      {location: new google.maps.LatLng(31.2003607189372, -97.29119432057972), weight: 16.3685},
      {location: new google.maps.LatLng(31.685913944368266, -97.08741679980412), weight: 22.51275},
      {location: new google.maps.LatLng(29.616605712062878, -95.38192859152441), weight: 199.148},
      {location: new google.maps.LatLng(29.882729400645935, -95.4531691745077), weight: 250.7635},
      {location: new google.maps.LatLng(30.058358792315005, -95.4696998451181), weight: 276.415},
      {location: new google.maps.LatLng(29.570766687757285, -95.63554512466183), weight: 454.3875},
      {location: new google.maps.LatLng(29.688815346515554, -95.15842830515547), weight: 169.90875},
      {location: new google.maps.LatLng(29.497321298183287, -95.37316077454291), weight: 112.67075},
      {location: new google.maps.LatLng(30.086301669757106, -93.79824805035109), weight: 247.9785},
      {location: new google.maps.LatLng(30.666609262634914, -96.43709063691963), weight: 80.88675},
      {location: new google.maps.LatLng(27.869697240853395, -97.20545033538293), weight: 32.544},
      {location: new google.maps.LatLng(28.04846159333332, -97.05893369644542), weight: 193.15275},
      {location: new google.maps.LatLng(26.279565968454392, -98.35111712801938), weight: 110.07575},
      {location: new google.maps.LatLng(30.24203027652173, -97.60310399281163), weight: 14.529},
      {location: new google.maps.LatLng(30.425507863939327, -97.71241414072371), weight: 155.8835},
      {location: new google.maps.LatLng(33.56416952608083, -101.97774004875217), weight: 116.1275},
      {location: new google.maps.LatLng(32.399993592425815, -99.71533003754125), weight: 240.8255},
      {location: new google.maps.LatLng(31.759566792689387, -106.47797454041672), weight: 82.87},
      {location: new google.maps.LatLng(32.917359999581876, -96.6765152496635), weight: 277.80975},
      {location: new google.maps.LatLng(33.64354396233766, -96.65083056167359), weight: 155.652},
      {location: new google.maps.LatLng(32.968679219502405, -96.79103420541792), weight: 164.7985},
      {location: new google.maps.LatLng(32.64376281632358, -96.95645881195969), weight: 69.9955},
      {location: new google.maps.LatLng(32.509160525831945, -94.72854980597172), weight: 132.63325},
      {location: new google.maps.LatLng(32.7628014683537, -94.94406081666193), weight: 48.1905},
      {location: new google.maps.LatLng(32.35936934170732, -95.18411952609759), weight: 5.438},
      {location: new google.maps.LatLng(32.17459485177329, -95.87370603121252), weight: 132.36225},
      {location: new google.maps.LatLng(32.50460722316585, -95.43151093243675), weight: 50.49},
      {location: new google.maps.LatLng(32.23191971346312, -98.21536488390112), weight: 14.35475},
      {location: new google.maps.LatLng(29.63067327021397, -95.21477015504365), weight: 230.54775},
      {location: new google.maps.LatLng(29.916213475668936, -95.44780950806876), weight: 156.796},
      {location: new google.maps.LatLng(29.807471110998947, -95.56116869483252), weight: 286.5665},
      {location: new google.maps.LatLng(29.816060903250158, -95.52324272105264), weight: 207.559},
      {location: new google.maps.LatLng(30.3330551290311, -95.5091757762302), weight: 183.939},
      {location: new google.maps.LatLng(30.117750691853303, -95.51632193895774), weight: 203.57525},
      {location: new google.maps.LatLng(29.644137703429557, -95.7656530323319), weight: 162.79525},
      {location: new google.maps.LatLng(29.83716499457615, -95.72733758326616), weight: 545.1435},
      {location: new google.maps.LatLng(29.03327874992975, -95.40212595119424), weight: 142.21375},
      {location: new google.maps.LatLng(28.977601890765516, -98.48171097108784), weight: 89.13425},
      {location: new google.maps.LatLng(29.748354190322, -98.17339337939386), weight: 66.93175},
      {location: new google.maps.LatLng(30.33211495976668, -97.70506120952263), weight: 116.553},
      {location: new google.maps.LatLng(30.404666320819413, -97.75678615633021), weight: 252.36825},
      {location: new google.maps.LatLng(34.98758799140965, -101.9268147357751), weight: 125.32175},
      {location: new google.maps.LatLng(33.59661306773298, -101.9427100082582), weight: 184.07675},
      {location: new google.maps.LatLng(31.85684357564123, -102.35424889680954), weight: 277.07975},
      {location: new google.maps.LatLng(32.99176926693173, -96.65889743549896), weight: 168.60575},
      {location: new google.maps.LatLng(32.999668949517066, -96.84322797410174), weight: 162.081},
      {location: new google.maps.LatLng(32.31672180119284, -95.38431775447322), weight: 41.83175},
      {location: new google.maps.LatLng(32.57293939305026, -97.3796277280075), weight: 10.69575},
      {location: new google.maps.LatLng(32.65875398009242, -97.48554947312222), weight: 125.61825},
      {location: new google.maps.LatLng(32.88108933647477, -97.34430528391361), weight: 223.866},
      {location: new google.maps.LatLng(32.87476112037294, -97.40913959512878), weight: 381.944},
      {location: new google.maps.LatLng(30.059035380075926, -95.38749504489198), weight: 329.07325},
      {location: new google.maps.LatLng(30.23037831887946, -95.49394258720974), weight: 118.94},
      {location: new google.maps.LatLng(29.62775414759324, -95.5697981575952), weight: 329.851},
      {location: new google.maps.LatLng(29.811948521087988, -95.8131405612895), weight: 197.768},
      {location: new google.maps.LatLng(30.245776939821816, -94.20549581895776), weight: 132.91975},
      {location: new google.maps.LatLng(28.919507492781324, -98.5497113190021), weight: 30.69},
      {location: new google.maps.LatLng(29.875747129030614, -98.398383056321), weight: 14.01725},
      {location: new google.maps.LatLng(29.41355258391446, -98.69620411083221), weight: 360.61475},
      {location: new google.maps.LatLng(29.590237972398086, -98.52570210099316), weight: 86.14425},
      {location: new google.maps.LatLng(29.56175012703673, -98.61730079211588), weight: 365.68475},
      {location: new google.maps.LatLng(29.352638030523817, -98.68878629366245), weight: 60.78875},
      {location: new google.maps.LatLng(25.972354258464517, -97.47915524651145), weight: 212.73375},
      {location: new google.maps.LatLng(30.52395467953634, -97.72131502310333), weight: 324.16625},
      {location: new google.maps.LatLng(30.49617719373489, -97.76253357639098), weight: 150.67575},
      {location: new google.maps.LatLng(30.140099526094133, -97.67622312155243), weight: 37.3705},
      {location: new google.maps.LatLng(35.1731334477883, -101.92919326007109), weight: 51.9595},
      {location: new google.maps.LatLng(32.484223952556384, -99.70954441030078), weight: 208.42725},
      {location: new google.maps.LatLng(31.850135802288747, -106.54191059146972), weight: 383.03425},
      {location: new google.maps.LatLng(33.033830429373815, -96.67321705812358), weight: 412.816},
      {location: new google.maps.LatLng(32.52534349978969, -94.80209928677502), weight: 249.9715},
      {location: new google.maps.LatLng(32.53578411806776, -94.85855370862608), weight: 51.42525},
      {location: new google.maps.LatLng(32.65356284905344, -97.37579274217), weight: 300.567},
      {location: new google.maps.LatLng(32.93773421675583, -97.32039228024821), weight: 205.16275},
      {location: new google.maps.LatLng(32.840417517029024, -97.22460279361911), weight: 237.816},
      {location: new google.maps.LatLng(29.595741452856107, -95.45764218086973), weight: 167.495},
      {location: new google.maps.LatLng(29.95434966373559, -95.45393196513052), weight: 169.17925},
      {location: new google.maps.LatLng(29.69210125272913, -95.65027231633911), weight: 352.757},
      {location: new google.maps.LatLng(29.226555316478283, -95.33584058530631), weight: 10.21175},
      {location: new google.maps.LatLng(30.140456464535387, -94.16177900164114), weight: 97.45325},
      {location: new google.maps.LatLng(29.456205054774248, -98.44411457542563), weight: 65.77575},
      {location: new google.maps.LatLng(29.476246556603765, -98.35222934145278), weight: 188.15725},
      {location: new google.maps.LatLng(26.28438076119027, -98.17890159403133), weight: 233.83725},
      {location: new google.maps.LatLng(26.350126814137443, -98.20018169441686), weight: 131.1255},
      {location: new google.maps.LatLng(26.16043349879783, -97.98446330954947), weight: 0.14675},
      {location: new google.maps.LatLng(30.558439442023552, -97.86499594596248), weight: 232.99475},
      {location: new google.maps.LatLng(33.54669637, -101.85193428000002), weight: 0.41925},
      {location: new google.maps.LatLng(31.984592918150692, -102.13137025459176), weight: 156.964},
      {location: new google.maps.LatLng(31.823031770365333, -106.57527832739916), weight: 69.3235},
      {location: new google.maps.LatLng(33.05639998529648, -96.7355949627716), weight: 278.6425},
      {location: new google.maps.LatLng(33.47025914237737, -94.08656495492106), weight: 197.93375},
      {location: new google.maps.LatLng(33.08390477405608, -97.46459342074762), weight: 0.194},
      {location: new google.maps.LatLng(31.348909697683393, -97.23547991544409), weight: 7.305},
      {location: new google.maps.LatLng(29.78920378433541, -95.23626210087528), weight: 147.40325},
      {location: new google.maps.LatLng(29.616381906604843, -95.60488925958953), weight: 282.4185},
      {location: new google.maps.LatLng(29.64718978097152, -95.18824140509214), weight: 150.4},
      {location: new google.maps.LatLng(29.663239604658152, -95.0560358205235), weight: 439.10625},
      {location: new google.maps.LatLng(30.09630788047969, -94.24703890923338), weight: 82.11175},
      {location: new google.maps.LatLng(29.44062455315852, -98.47963522085814), weight: 37.23},
      {location: new google.maps.LatLng(29.37983867427647, -98.38806321491265), weight: 138.4775},
      {location: new google.maps.LatLng(29.54402525762428, -98.55336902397394), weight: 258.30425},
      {location: new google.maps.LatLng(29.351631397116964, -98.61289391268535), weight: 145.08625},
      {location: new google.maps.LatLng(27.846170558908128, -97.5983132575873), weight: 184.1935},
      {location: new google.maps.LatLng(30.652839625903834, -97.72397962206297), weight: 13.6495},
      {location: new google.maps.LatLng(30.541705367251456, -97.55847831913938), weight: 81.3585},
      {location: new google.maps.LatLng(30.45157122449219, -97.61224004132696), weight: 490.4355},
      {location: new google.maps.LatLng(30.32164288899314, -97.97628900235772), weight: 2.98225},
      {location: new google.maps.LatLng(30.375722412125533, -97.67457351298823), weight: 300.5105},
      {location: new google.maps.LatLng(35.20548653467691, -101.8433538572616), weight: 62.701},
      {location: new google.maps.LatLng(35.242078129168256, -101.94596087677554), weight: 72.2925},
      {location: new google.maps.LatLng(32.80012149403279, -96.56799751655741), weight: 72.464},
      {location: new google.maps.LatLng(32.13833822496181, -95.36472130320807), weight: 0.6865},
      {location: new google.maps.LatLng(29.73983088521401, -95.44609894492665), weight: 128.23975},
      {location: new google.maps.LatLng(29.626518176067133, -95.33725146821008), weight: 127.19425},
      {location: new google.maps.LatLng(29.925753113478983, -95.39446894410759), weight: 235.67625},
      {location: new google.maps.LatLng(30.12180236836757, -95.39379669248214), weight: 299.021},
      {location: new google.maps.LatLng(29.678302586541985, -95.71614123860412), weight: 217.7525},
      {location: new google.maps.LatLng(29.686739323787886, -95.11799664367723), weight: 267.184},
      {location: new google.maps.LatLng(29.499476076030422, -98.31579110724644), weight: 267.52425},
      {location: new google.maps.LatLng(29.572500052208017, -98.53979412237076), weight: 68.40775},
      {location: new google.maps.LatLng(29.461617401065624, -98.7469538690733), weight: 245.1855},
      {location: new google.maps.LatLng(27.81460123747314, -97.07652862388339), weight: 75.099},
      {location: new google.maps.LatLng(30.294500668417466, -97.80888634572511), weight: 235.06525},
      {location: new google.maps.LatLng(30.383625285283017, -97.7028103371698), weight: 350.7895},
      {location: new google.maps.LatLng(32.194975513525094, -95.38498898572011), weight: 43.766},
      {location: new google.maps.LatLng(33.003793260798886, -97.48452470060381), weight: 2.698},
      {location: new google.maps.LatLng(31.05563209838581, -97.72169560466638), weight: 274.192},
      {location: new google.maps.LatLng(31.0826116726123, -97.78558119783463), weight: 277.279},
      {location: new google.maps.LatLng(31.078584616961802, -97.60467456430564), weight: 30.0125},
      {location: new google.maps.LatLng(29.722475307888992, -95.62834338967232), weight: 292.115},
      {location: new google.maps.LatLng(30.19129290981472, -94.69166582754136), weight: 0.44275},
      {location: new google.maps.LatLng(29.97878691865375, -93.9607181674552), weight: 121.69125},
      {location: new google.maps.LatLng(29.449807376455777, -98.39956776811547), weight: 295.847},
      {location: new google.maps.LatLng(29.632085910406982, -98.43008278895164), weight: 202.02675},
      {location: new google.maps.LatLng(30.19397831824459, -97.96326299507318), weight: 18.066},
      {location: new google.maps.LatLng(33.5471220596611, -101.88747709093028), weight: 160.97475},
      {location: new google.maps.LatLng(29.653403284760124, -95.4810214232833), weight: 186.03775},
      {location: new google.maps.LatLng(29.536254939474404, -98.4959620263885), weight: 410.02175},
      {location: new google.maps.LatLng(29.676177457126034, -98.42045682114906), weight: 123.4095},
      {location: new google.maps.LatLng(31.84607432476089, -106.36182152635499), weight: 44.23475},
      {location: new google.maps.LatLng(32.82316677733887, -97.05284204719334), weight: 95.74925},
      {location: new google.maps.LatLng(29.746227669147324, -95.48760331527376), weight: 225.53325},
      {location: new google.maps.LatLng(29.673760449380808, -95.48241953779296), weight: 217.875},
      {location: new google.maps.LatLng(29.544504788165675, -95.14040115395994), weight: 187.4535},
      {location: new google.maps.LatLng(29.430421051644093, -98.20090673394584), weight: 2.55175},
      {location: new google.maps.LatLng(29.5546120666057, -98.36562117193493), weight: 370.92},
      {location: new google.maps.LatLng(32.41693905210607, -99.82529338127922), weight: 28.252},
      {location: new google.maps.LatLng(31.771897310491614, -106.33028942881904), weight: 136.53975},
      {location: new google.maps.LatLng(32.78459428101802, -96.77565917465539), weight: 39.3875},
      {location: new google.maps.LatLng(29.63635202144674, -98.31760453034768), weight: 78.33975},
      {location: new google.maps.LatLng(33.97120254245811, -98.51439421284918), weight: 44.6885},
      {location: new google.maps.LatLng(33.5836798981132, -101.89787626792454), weight: 2.99175},
      {location: new google.maps.LatLng(29.533354948780488, -98.4018006780488), weight: 7.442},
      {location: new google.maps.LatLng(32.956258364285716, -97.02708532857142), weight: 11.686},
      {location: new google.maps.LatLng(34.98083148888889, -101.91560527777777), weight: 1.69875},
      {location: new google.maps.LatLng(29.62751271134752, -95.06002053359933), weight: 109.57675},
      {location: new google.maps.LatLng(29.534690102040816, -98.57120808571439), weight: 14.727},
      {location: new google.maps.LatLng(33.17649699787234, -96.83206741914893), weight: 3.45975},
      {location: new google.maps.LatLng(32.791756808660786, -96.82679850737763), weight: 134.5685},
      {location: new google.maps.LatLng(29.534132252307696, -98.28034131076923), weight: 8.06875},
      {location: new google.maps.LatLng(32.78015632279792, -96.80431345336785), weight: 16.7645},
      {location: new google.maps.LatLng(32.75937430391277, -97.329826430789), weight: 103.90425},
      {location: new google.maps.LatLng(31.063566918250288, -97.65462018623991), weight: 188.44575},
      {location: new google.maps.LatLng(29.557885719905222, -95.09782247741704), weight: 165.585},
      {location: new google.maps.LatLng(29.5980810305889, -95.51563543370943), weight: 244.997},
      {location: new google.maps.LatLng(29.734990945691095, -95.81421779176878), weight: 664.75525},
      {location: new google.maps.LatLng(30.186660443753976, -93.8104281637874), weight: 44.2015},
      {location: new google.maps.LatLng(30.612851532387573, -96.32263115362787), weight: 261.40125},
      {location: new google.maps.LatLng(29.569328067840708, -98.27963925372553), weight: 362.9255},
      {location: new google.maps.LatLng(29.634963262886828, -98.49818395298128), weight: 316.1965},
      {location: new google.maps.LatLng(30.258189666929578, -97.85728908664784), weight: 138.16125},
      {location: new google.maps.LatLng(35.12437044103109, -101.94898820061121), weight: 112.481},
      {location: new google.maps.LatLng(32.252040403166234, -99.80051700696578), weight: 8.56975},
      {location: new google.maps.LatLng(33.02542089003773, -96.7399016022997), weight: 285.82775},
      {location: new google.maps.LatLng(31.45377355247346, -97.19743685268922), weight: 113.87825},
      {location: new google.maps.LatLng(31.537013474085235, -97.18991094223013), weight: 264.199},
      {location: new google.maps.LatLng(31.504899716763372, -97.2358202168631), weight: 336.49775},
      {location: new google.maps.LatLng(29.479777116712548, -98.61611080677676), weight: 248.44125},
      {location: new google.maps.LatLng(29.367598422046065, -98.31652596009575), weight: 3.63325},
      {location: new google.maps.LatLng(34.08675404248498, -98.56871440719223), weight: 0.25325},
      {location: new google.maps.LatLng(30.577939537103145, -97.41051059603649), weight: 1.47125},
      {location: new google.maps.LatLng(27.6864045048118, -97.40327099925828), weight: 8.1435},
      {location: new google.maps.LatLng(32.78616159604965, -96.79583252088041), weight: 43.475},
      {location: new google.maps.LatLng(31.549803506969695, -97.14111843818183), weight: 43.8965},
      {location: new google.maps.LatLng(31.132316146157944, -97.78180625355753), weight: 157.623},
      {location: new google.maps.LatLng(29.503134440369465, -98.57246805167489), weight: 198.921},
      {location: new google.maps.LatLng(29.68404390403045, -95.40046989095387), weight: 207.843},
      {location: new google.maps.LatLng(32.70892417499999, -97.3620988875), weight: 2.1025},
      {location: new google.maps.LatLng(29.733932647945203, -95.43242661780815), weight: 13.1165},
      {location: new google.maps.LatLng(31.44136092307692, -100.46545406923074), weight: 3.243},
      {location: new google.maps.LatLng(30.21878323636363, -97.7474793909091), weight: 8.23475},
      {location: new google.maps.LatLng(29.75453045588236, -95.36072857647056), weight: 5.46025},
      {location: new google.maps.LatLng(29.418421616666674, -98.4780239), weight: 6.06275},
      {location: new google.maps.LatLng(32.47001530357143, -99.70818018571424), weight: 9.1115},
      {location: new google.maps.LatLng(32.918592991228074, -96.77098639064326), weight: 17.6665},
      {location: new google.maps.LatLng(32.61660029250694, -99.81824450499539), weight: 1.7075},
      {location: new google.maps.LatLng(32.76560247939257, -97.01023980979028), weight: 349.39125},
      {location: new google.maps.LatLng(32.826304742989116, -96.9631787638318), weight: 195.699},
      {location: new google.maps.LatLng(32.77734048314866, -97.08148342223001), weight: 56.8305},
      {location: new google.maps.LatLng(32.78259368274401, -97.35902830745859), weight: 80.3515},
      {location: new google.maps.LatLng(33.10823310600817, -97.15996412025152), weight: 66.15925},
      {location: new google.maps.LatLng(30.308817080915986, -95.00031794947229), weight: 53.6315},
      {location: new google.maps.LatLng(30.40240242413659, -95.64950220890131), weight: 84.436},
      {location: new google.maps.LatLng(35.199928157171215, -101.84915898062029), weight: 59.91125},
      {location: new google.maps.LatLng(31.69062062770682, -106.21305458722182), weight: 28.3655},
      {location: new google.maps.LatLng(33.029409459416115, -96.89705339229712), weight: 98.9225},
      {location: new google.maps.LatLng(32.72644631877975, -97.00252809196539), weight: 191.25075},
      {location: new google.maps.LatLng(33.12434638596249, -97.03312987662387), weight: 49.528},
      {location: new google.maps.LatLng(32.695775749307245, -97.08804026991973), weight: 102.348},
      {location: new google.maps.LatLng(32.746386221611864, -97.26285472480517), weight: 68.83025},
      {location: new google.maps.LatLng(32.8056534547124, -97.3546802431891), weight: 299.8945},
      {location: new google.maps.LatLng(31.090578108918894, -97.30672186222196), weight: 83.10725},
      {location: new google.maps.LatLng(31.551398567900407, -97.1614477628714), weight: 67.185},
      {location: new google.maps.LatLng(29.795514801391107, -95.3698713422463), weight: 188.3065},
      {location: new google.maps.LatLng(29.77575581173267, -95.31203868509331), weight: 245.47725},
      {location: new google.maps.LatLng(30.056615575128507, -95.21708685046124), weight: 152.67425},
      {location: new google.maps.LatLng(29.4274500087407, -98.45954668251858), weight: 64.509},
      {location: new google.maps.LatLng(27.776574296914756, -97.42887947579513), weight: 107.97275},
      {location: new google.maps.LatLng(32.65923393306042, -96.91187786628456), weight: 79.2905},
      {location: new google.maps.LatLng(32.600052024313975, -96.68429551059342), weight: 27.22125},
      {location: new google.maps.LatLng(32.84279504095368, -96.7002242694798), weight: 113.5915},
      {location: new google.maps.LatLng(32.813417263629816, -96.81332622657543), weight: 53.4175},
      {location: new google.maps.LatLng(32.76829776655846, -96.68539699324933), weight: 227.69525},
      {location: new google.maps.LatLng(32.92935054425295, -96.87721809454952), weight: 186.60175},
      {location: new google.maps.LatLng(32.68421827806748, -96.91804368888035), weight: 109.595},
      {location: new google.maps.LatLng(32.79922546655172, -97.09035987862072), weight: 2.23275},
      {location: new google.maps.LatLng(32.861086794592325, -97.17652919000211), weight: 59.651},
      {location: new google.maps.LatLng(32.72569580286728, -97.31726887354408), weight: 140.21075},
      {location: new google.maps.LatLng(29.77426499077562, -95.40598924688787), weight: 256.413},
      {location: new google.maps.LatLng(29.91954975257462, -95.55548718870878), weight: 226.3995},
      {location: new google.maps.LatLng(29.98283944582966, -95.52397013500261), weight: 69.616},
      {location: new google.maps.LatLng(30.22876945252258, -95.365754142766), weight: 82.205},
      {location: new google.maps.LatLng(29.56283568206779, -98.15443690096517), weight: 0.97525},
      {location: new google.maps.LatLng(29.362401748471665, -98.49214355375132), weight: 112.51125},
      {location: new google.maps.LatLng(30.292546026956774, -97.76404387842612), weight: 101.766},
      {location: new google.maps.LatLng(30.273181329961282, -97.68549495969033), weight: 69.8865},
      {location: new google.maps.LatLng(35.153547618427275, -101.86463197505913), weight: 124.1135},
      {location: new google.maps.LatLng(33.62093739251355, -101.79699177248706), weight: 121.566},
      {location: new google.maps.LatLng(31.798029647522146, -106.22172759157553), weight: 5.41375},
      {location: new google.maps.LatLng(33.75248229923709, -96.57275640078863), weight: 159.74825},
      {location: new google.maps.LatLng(32.80267844320432, -96.78768509654971), weight: 71.9875},
      {location: new google.maps.LatLng(32.683797636925036, -96.5943254532021), weight: 64.7045},
      {location: new google.maps.LatLng(32.68823742088726, -97.19057241697884), weight: 126.07625},
      {location: new google.maps.LatLng(31.519874894952256, -97.15034168472037), weight: 71.8985},
      {location: new google.maps.LatLng(31.471836080794038, -100.44015276237945), weight: 229.872},
      {location: new google.maps.LatLng(29.799842393820143, -95.41174668346305), weight: 271.26175},
      {location: new google.maps.LatLng(30.00469505480635, -95.48723453438282), weight: 50.26825},
      {location: new google.maps.LatLng(29.39752302731459, -98.46453363937559), weight: 173.72325},
      {location: new google.maps.LatLng(29.46307593987157, -98.4962946281897), weight: 166.495},
      {location: new google.maps.LatLng(27.768068397387324, -97.40056210826259), weight: 92.6115},
      {location: new google.maps.LatLng(30.294513761135228, -97.73792942110181), weight: 92.44},
      {location: new google.maps.LatLng(32.72001419949069, -96.61531248848686), weight: 98.58225},
      {location: new google.maps.LatLng(32.82616502563719, -96.67894735132623), weight: 280.25525},
      {location: new google.maps.LatLng(31.59415456055063, -94.68271527075238), weight: 72.306},
      {location: new google.maps.LatLng(32.8192290627668, -97.17934220246187), weight: 146.98},
      {location: new google.maps.LatLng(33.89285228122456, -98.53588754138399), weight: 83.5125},
      {location: new google.maps.LatLng(29.724442919838495, -95.31980175457387), weight: 187.3175},
      {location: new google.maps.LatLng(29.849568565523267, -95.25759733744817), weight: 91.447},
      {location: new google.maps.LatLng(30.036300252979643, -95.5330212369121), weight: 324.22},
      {location: new google.maps.LatLng(30.137947694314427, -95.46871922504454), weight: 156.10825},
      {location: new google.maps.LatLng(29.92757317537216, -95.0707118436718), weight: 93.9615},
      {location: new google.maps.LatLng(27.51513256212088, -99.49967236582285), weight: 207.3135},
      {location: new google.maps.LatLng(27.45880277860368, -99.46433058906169), weight: 165.96275},
      {location: new google.maps.LatLng(29.35713848389531, -98.54686916407485), weight: 156.09475},
      {location: new google.maps.LatLng(27.753269637234432, -97.4354968836936), weight: 83.4845},
      {location: new google.maps.LatLng(30.234168168119265, -97.67454219357805), weight: 5.96525},
      {location: new google.maps.LatLng(32.88212420692207, -96.64288945830431), weight: 293.077},
      {location: new google.maps.LatLng(32.73560438583015, -96.55956837796306), weight: 87.3565},
      {location: new google.maps.LatLng(32.704954571016046, -96.87222077368979), weight: 78.001},
      {location: new google.maps.LatLng(32.93281120303594, -96.78380822447329), weight: 69.4545},
      {location: new google.maps.LatLng(31.199412587844037, -94.77285720028672), weight: 33.50225},
      {location: new google.maps.LatLng(32.63357320110544, -97.14592660596566), weight: 133.026},
      {location: new google.maps.LatLng(31.09950038177674, -97.36479965654874), weight: 219.23025},
      {location: new google.maps.LatLng(29.74246668258483, -95.30713300999665), weight: 137.1115},
      {location: new google.maps.LatLng(29.751649450795288, -95.40520487909755), weight: 114.413},
      {location: new google.maps.LatLng(29.696399435160785, -95.35701302605162), weight: 181.50525},
      {location: new google.maps.LatLng(29.928362261625868, -95.60526555547986), weight: 153.07725},
      {location: new google.maps.LatLng(30.041312154029928, -95.64098523388023), weight: 178.662},
      {location: new google.maps.LatLng(30.680818433644205, -96.37822621271677), weight: 176.4745},
      {location: new google.maps.LatLng(29.232450664850784, -98.6187359678351), weight: 13.551},
      {location: new google.maps.LatLng(31.80904674555421, -106.42815096723514), weight: 107.34725},
      {location: new google.maps.LatLng(31.88467279179367, -106.55663908528719), weight: 2.91975},
      {location: new google.maps.LatLng(32.95666041196134, -96.84236000592027), weight: 127.16075},
      {location: new google.maps.LatLng(33.00627017314475, -96.89286001841178), weight: 242.92575},
      {location: new google.maps.LatLng(32.52706644882653, -96.6529494764286), weight: 6.48075},
      {location: new google.maps.LatLng(32.664977306750224, -96.83868170035805), weight: 144.7005},
      {location: new google.maps.LatLng(32.37458557418478, -95.3877459360055), weight: 37.2295},
      {location: new google.maps.LatLng(32.15034079946236, -95.12741434684143), weight: 0.11225},
      {location: new google.maps.LatLng(31.59202326474654, -94.62485752615208), weight: 78.21775},
      {location: new google.maps.LatLng(32.75662046265136, -97.09556361488524), weight: 225.5875},
      {location: new google.maps.LatLng(32.82686140279535, -97.45416840708819), weight: 90.511},
      {location: new google.maps.LatLng(31.594969925027495, -97.19688554726906), weight: 154.672},
      {location: new google.maps.LatLng(31.454677111822285, -100.39131560883531), weight: 54.69025},
      {location: new google.maps.LatLng(29.717706195145958, -95.42836328638806), weight: 145.48875},
      {location: new google.maps.LatLng(29.68651885558293, -95.25699249291081), weight: 175.09075},
      {location: new google.maps.LatLng(29.880412912008417, -95.5254972531054), weight: 384.05325},
      {location: new google.maps.LatLng(29.98646263795812, -95.65626450719033), weight: 406.96875},
      {location: new google.maps.LatLng(29.54358766983604, -95.81075513354388), weight: 124.06075},
      {location: new google.maps.LatLng(29.7903583227947, -95.12854169363266), weight: 203.4705},
      {location: new google.maps.LatLng(29.820985173040693, -95.04851122902079), weight: 73.66975},
      {location: new google.maps.LatLng(29.36997935961986, -94.98255871454944), weight: 114.3445},
      {location: new google.maps.LatLng(30.06989141398682, -94.10493403796211), weight: 181.3565},
      {location: new google.maps.LatLng(28.03930413593064, -97.53020996931058), weight: 55.12475},
      {location: new google.maps.LatLng(27.728007627048193, -97.45364442114457), weight: 28.1045},
      {location: new google.maps.LatLng(26.202883324504384, -98.1506401010551), weight: 167.35675},
      {location: new google.maps.LatLng(32.38139350199951, -99.51191974542088), weight: 34.3905},
      {location: new google.maps.LatLng(31.74343639886468, -106.36959424771686), weight: 228.28975},
      {location: new google.maps.LatLng(32.96686912560201, -96.8841663168405), weight: 418.58875},
      {location: new google.maps.LatLng(33.08895490842738, -96.74387523538556), weight: 218.64225},
      {location: new google.maps.LatLng(33.078657936097535, -96.891940467485), weight: 266.54925},
      {location: new google.maps.LatLng(32.9279842104468, -96.54786275251789), weight: 149.3085},
      {location: new google.maps.LatLng(32.54030127374777, -94.93413771815743), weight: 47.4075},
      {location: new google.maps.LatLng(32.22944611595976, -95.22027645361614), weight: 50.4895},
      {location: new google.maps.LatLng(32.47556596103896, -95.14083373662338), weight: 2.343},
      {location: new google.maps.LatLng(32.76288210283329, -97.49285221237669), weight: 194.4935},
      {location: new google.maps.LatLng(32.76515548890082, -97.18616146541429), weight: 65.969},
      {location: new google.maps.LatLng(31.46874018052733, -100.48321433529267), weight: 156.8045},
      {location: new google.maps.LatLng(29.668882171927297, -95.33844278536806), weight: 159.85975},
      {location: new google.maps.LatLng(29.773888095846868, -95.59812120106736), weight: 206.54875},
      {location: new google.maps.LatLng(29.674300481012665, -95.41709597088608), weight: 13.60075},
      {location: new google.maps.LatLng(29.414006130123198, -95.25149092161594), weight: 300.99},
      {location: new google.maps.LatLng(29.46360028101735, -95.04226883585739), weight: 247.87875},
      {location: new google.maps.LatLng(29.44820647713764, -95.44211345721673), weight: 69.97025},
      {location: new google.maps.LatLng(29.991949428144245, -94.13454014293833), weight: 240.3975},
      {location: new google.maps.LatLng(27.507745376529897, -99.4566026231896), weight: 165.3505},
      {location: new google.maps.LatLng(29.503769280752266, -98.66874002820711), weight: 265.85825},
      {location: new google.maps.LatLng(26.308682923313086, -98.10548953025021), weight: 154.82575},
      {location: new google.maps.LatLng(30.45285339977242, -97.76706897544565), weight: 172.2315},
      {location: new google.maps.LatLng(30.166611303308308, -97.82577286085382), weight: 247.749},
      {location: new google.maps.LatLng(33.688471173096296, -101.9984300297986), weight: 7.3605},
      {location: new google.maps.LatLng(33.54667311559579, -101.85827145774813), weight: 92.25875},
      {location: new google.maps.LatLng(31.779465260843676, -106.49424630944586), weight: 124.10075},
      {location: new google.maps.LatLng(32.92467900593457, -96.62359878141703), weight: 328.882},
      {location: new google.maps.LatLng(32.58896010561911, -96.94638010768276), weight: 275.81775},
      {location: new google.maps.LatLng(32.64399995725906, -96.70648222578221), weight: 58.64075},
      {location: new google.maps.LatLng(33.40928763978248, -94.09462722842883), weight: 265.76425},
      {location: new google.maps.LatLng(32.264181463258076, -95.49165306197429), weight: 16.60725},
      {location: new google.maps.LatLng(31.345203758324253, -94.75648789729782), weight: 186.718},
      {location: new google.maps.LatLng(31.43176788813839, -94.83263686392083), weight: 1.3635},
      {location: new google.maps.LatLng(32.870307541297244, -97.28502181525974), weight: 324.46875},
      {location: new google.maps.LatLng(33.94559092342291, -98.52597448702126), weight: 134.19375},
      {location: new google.maps.LatLng(29.707576858855372, -95.40845878619494), weight: 88.12575},
      {location: new google.maps.LatLng(29.68710598283267, -95.30172976539816), weight: 236.52125},
      {location: new google.maps.LatLng(30.31148576171494, -95.63581654351735), weight: 63.92825},
      {location: new google.maps.LatLng(29.206755679682857, -94.95981734085107), weight: 140.274},
      {location: new google.maps.LatLng(29.501179372946005, -95.09187899437799), weight: 454.41575},
      {location: new google.maps.LatLng(29.818702339431077, -98.69916256840816), weight: 0.582},
      {location: new google.maps.LatLng(29.878391340519975, -98.24561006265259), weight: 136.90825},
      {location: new google.maps.LatLng(29.345328985783397, -98.4230410714201), weight: 273.2735},
      {location: new google.maps.LatLng(27.979796963457222, -97.38189620577135), weight: 42.654},
      {location: new google.maps.LatLng(27.793848570546317, -97.40256421068882), weight: 60.566},
      {location: new google.maps.LatLng(27.726630076453613, -97.42408075180903), weight: 218.288},
      {location: new google.maps.LatLng(30.229754453818412, -97.71585346509333), weight: 167.4055},
      {location: new google.maps.LatLng(35.16682003035357, -101.88475429903573), weight: 283.8945},
      {location: new google.maps.LatLng(35.10745633799238, -101.83488643441844), weight: 184.336},
      {location: new google.maps.LatLng(31.70945984620477, -106.32920672714185), weight: 268.093},
      {location: new google.maps.LatLng(33.09533313646111, -96.63242337004027), weight: 376.03725},
      {location: new google.maps.LatLng(32.89569525996873, -96.54582874194894), weight: 162.50325},
      {location: new google.maps.LatLng(32.58795364671809, -96.7783610890277), weight: 110.70325},
      {location: new google.maps.LatLng(32.324631874052656, -95.29369838987417), weight: 265.597},
      {location: new google.maps.LatLng(32.428894345340495, -95.31593603803753), weight: 37.26625},
      {location: new google.maps.LatLng(32.23065678829027, -95.80368319073558), weight: 7.17575},
      {location: new google.maps.LatLng(32.62151733355515, -97.27655623689866), weight: 237.1745},
      {location: new google.maps.LatLng(32.924592340550944, -97.2292178930994), weight: 228.24125},
      {location: new google.maps.LatLng(32.99852463892599, -97.2209261791377), weight: 266.755},
      {location: new google.maps.LatLng(31.090060037193947, -97.40603623812723), weight: 246.277},
      {location: new google.maps.LatLng(31.448199470735062, -97.38244255988984), weight: 60.70675},
      {location: new google.maps.LatLng(31.620992949281465, -97.10404617966357), weight: 228.627},
      {location: new google.maps.LatLng(29.78067481495834, -95.18220404367194), weight: 413.388},
      {location: new google.maps.LatLng(29.890027779847507, -95.39441314763046), weight: 127.7545},
      {location: new google.maps.LatLng(29.959909912242495, -95.49639434565434), weight: 229.1555},
      {location: new google.maps.LatLng(29.99868328717991, -95.40396460502424), weight: 312.235},
      {location: new google.maps.LatLng(29.62642914134046, -95.47996941653619), weight: 92.31925},
      {location: new google.maps.LatLng(28.977236635256535, -95.35127282148113), weight: 165.63},
      {location: new google.maps.LatLng(29.531522301492362, -95.47394610104007), weight: 112.28},
      {location: new google.maps.LatLng(29.34123615420207, -94.99776710292726), weight: 81.74},
      {location: new google.maps.LatLng(29.539983951383633, -95.03541557427903), weight: 67.343},
      {location: new google.maps.LatLng(29.396694796396613, -94.91998233122125), weight: 225.4055},
      {location: new google.maps.LatLng(29.92034949518885, -93.92659003971076), weight: 271.83775},
      {location: new google.maps.LatLng(30.15469994467165, -94.0080434851605), weight: 133.021},
      {location: new google.maps.LatLng(29.4123985178106, -98.41041755434408), weight: 129.1795},
      {location: new google.maps.LatLng(29.458821908431304, -98.57031086373782), weight: 298.22675},
      {location: new google.maps.LatLng(30.306038460136122, -97.68627950335436), weight: 159.47425},
      {location: new google.maps.LatLng(30.142462699576203, -97.75536837673674), weight: 88.96375},
      {location: new google.maps.LatLng(33.5855921745648, -101.8557311546422), weight: 73.99725},
      {location: new google.maps.LatLng(31.852268732779326, -106.44027013404121), weight: 152.19525},
      {location: new google.maps.LatLng(32.976971736499536, -96.58484460941811), weight: 134.601},
      {location: new google.maps.LatLng(33.0155008590698, -96.54761327528314), weight: 316.95875},
      {location: new google.maps.LatLng(32.81649601816463, -96.63097615784068), weight: 326.14125},
      {location: new google.maps.LatLng(32.390484410089144, -95.24497390453806), weight: 61.26725},
      {location: new google.maps.LatLng(32.719203444642304, -97.44619718098178), weight: 269.064},
      {location: new google.maps.LatLng(31.11567971473074, -97.72808596458988), weight: 137.25225},
      {location: new google.maps.LatLng(31.778589298577113, -97.09578003065495), weight: 29.11325},
      {location: new google.maps.LatLng(31.498394986825215, -97.12121178744358), weight: 252.5795},
      {location: new google.maps.LatLng(29.90794000966582, -95.33961295576701), weight: 192.692},
      {location: new google.maps.LatLng(29.797509384658188, -95.49483727865157), weight: 331.8225},
      {location: new google.maps.LatLng(30.01151298619206, -95.2955764241733), weight: 291.25125},
      {location: new google.maps.LatLng(29.943450178815453, -95.72105523280001), weight: 386.6755},
      {location: new google.maps.LatLng(29.752411872607695, -95.74584141381584), weight: 390.012},
      {location: new google.maps.LatLng(29.546341446970068, -95.5419022188479), weight: 348.97675},
      {location: new google.maps.LatLng(29.679544505119193, -95.19898087401467), weight: 190.6745},
      {location: new google.maps.LatLng(29.51862132519233, -95.19063060182519), weight: 320.05175},
      {location: new google.maps.LatLng(28.810905370117553, -96.98521279615927), weight: 325.9145},
      {location: new google.maps.LatLng(29.559522697780586, -97.96724158751526), weight: 257.05225},
      {location: new google.maps.LatLng(29.510642689484555, -98.52363606019283), weight: 223.622},
      {location: new google.maps.LatLng(29.525696090641684, -98.70372993383127), weight: 274.652},
      {location: new google.maps.LatLng(27.93988417663204, -97.59117448835306), weight: 23.67925},
      {location: new google.maps.LatLng(25.943177299473952, -97.52844981394291), weight: 282.33375},
      {location: new google.maps.LatLng(25.915150789002514, -97.44704522139965), weight: 472.36425},
      {location: new google.maps.LatLng(30.501825098522264, -97.82666647474298), weight: 454.65025},
      {location: new google.maps.LatLng(30.450838895126115, -97.68197767013092), weight: 165.08175},
      {location: new google.maps.LatLng(30.345886991508646, -97.765747984974), weight: 148.00075},
      {location: new google.maps.LatLng(30.213069707711036, -97.86091366649532), weight: 192.40425},
      {location: new google.maps.LatLng(30.4318632021469, -97.80191478795409), weight: 153.08},
      {location: new google.maps.LatLng(32.447530328698974, -99.86797810739793), weight: 16.401},
      {location: new google.maps.LatLng(32.467051487677374, -99.76599487050528), weight: 194.388},
      {location: new google.maps.LatLng(31.90315096122523, -106.41419525318923), weight: 310.53125},
      {location: new google.maps.LatLng(33.17580561805863, -96.61137850438652), weight: 76.165},
      {location: new google.maps.LatLng(33.036868164021136, -96.80356130242372), weight: 325.65475},
      {location: new google.maps.LatLng(33.01996715128744, -96.61309207145261), weight: 118.58975},
      {location: new google.maps.LatLng(32.909848682026606, -96.73404065547747), weight: 276.17975},
      {location: new google.maps.LatLng(32.94487316891758, -96.79853315696792), weight: 67.39575},
      {location: new google.maps.LatLng(31.652287239204426, -94.63787236567956), weight: 75.4395},
      {location: new google.maps.LatLng(29.599549275440012, -95.11858268424058), weight: 95.326},
      {location: new google.maps.LatLng(29.84233275354557, -95.66943775105824), weight: 536.97025},
      {location: new google.maps.LatLng(29.703322241049104, -95.46119118702417), weight: 129.55475},
      {location: new google.maps.LatLng(29.649260115335988, -95.14603707777934), weight: 175.95275},
      {location: new google.maps.LatLng(30.639001494530838, -96.36248600922751), weight: 76.73775},
      {location: new google.maps.LatLng(27.600214905381595, -99.49553554248286), weight: 470.075},
      {location: new google.maps.LatLng(29.692518821735572, -98.1022848758709), weight: 506.713},
      {location: new google.maps.LatLng(29.48907034569205, -98.45539168937793), weight: 268.829},
      {location: new google.maps.LatLng(26.173813083915984, -98.25008563552008), weight: 240.165},
      {location: new google.maps.LatLng(26.212794649022893, -98.33984390289817), weight: 346.527},
      {location: new google.maps.LatLng(30.505964307170103, -97.64706781091084), weight: 341.0175},
      {location: new google.maps.LatLng(30.433525101068057, -97.8343521372291), weight: 76.0985},
      {location: new google.maps.LatLng(30.328130842007823, -97.87081522083444), weight: 58.37525},
      {location: new google.maps.LatLng(33.49584963129301, -101.87374325961824), weight: 258.696},
      {location: new google.maps.LatLng(32.432362146296136, -99.77194226594816), weight: 229.74475},
      {location: new google.maps.LatLng(31.75192687209051, -102.35829999653019), weight: 49.00725},
      {location: new google.maps.LatLng(32.86924477958979, -97.25013658308997), weight: 154.108},
      {location: new google.maps.LatLng(33.865044363913675, -98.49440808684388), weight: 105.464},
      {location: new google.maps.LatLng(29.76963027955019, -95.52036584739403), weight: 267.6875},
      {location: new google.maps.LatLng(29.921955594512053, -95.49167771273903), weight: 187.69175},
      {location: new google.maps.LatLng(30.010775775912833, -95.44840697340989), weight: 191.987},
      {location: new google.maps.LatLng(29.5609562741028, -95.27111975696106), weight: 355.62775},
      {location: new google.maps.LatLng(29.552243474345083, -95.36244379016213), weight: 477.48975},
      {location: new google.maps.LatLng(29.57761992915976, -95.03384770803261), weight: 143.30225},
      {location: new google.maps.LatLng(29.94556586325826, -93.91628809582701), weight: 127.585},
      {location: new google.maps.LatLng(30.356871248708533, -94.33301766871472), weight: 20.102},
      {location: new google.maps.LatLng(29.60573926099815, -98.03822487923594), weight: 25.593},
      {location: new google.maps.LatLng(29.584611897425873, -98.46823269340992), weight: 248.58625},
      {location: new google.maps.LatLng(30.133405927880172, -97.8400401342166), weight: 31.655},
      {location: new google.maps.LatLng(30.364481339217676, -97.63899178633079), weight: 152.869},
      {location: new google.maps.LatLng(32.37893701855537, -99.78150297854671), weight: 182.50375},
      {location: new google.maps.LatLng(32.857460429490274, -96.59873166212168), weight: 315.70925},
      {location: new google.maps.LatLng(32.94704671741442, -96.70653860609093), weight: 322.67525},
      {location: new google.maps.LatLng(32.96744958454682, -97.38349685173974), weight: 159.349},
      {location: new google.maps.LatLng(32.64396014924271, -97.3353448658548), weight: 171.14075},
      {location: new google.maps.LatLng(33.85645482532586, -98.56998658088293), weight: 121.16075},
      {location: new google.maps.LatLng(33.947336012947446, -98.67177327844634), weight: 7.26275},
      {location: new google.maps.LatLng(31.130805111556054, -97.91623834306836), weight: 119.67375},
      {location: new google.maps.LatLng(29.687851854297953, -95.43475784689045), weight: 169.8785},
      {location: new google.maps.LatLng(29.940973067636712, -95.33885005193625), weight: 317.19},
      {location: new google.maps.LatLng(29.629778298686002, -95.43606341480427), weight: 205.0705},
      {location: new google.maps.LatLng(29.82554273274833, -95.16773742635951), weight: 242.21575},
      {location: new google.maps.LatLng(29.70002221777332, -95.58976856203131), weight: 287.24425},
      {location: new google.maps.LatLng(29.750038507407115, -95.61042328383918), weight: 304.28725},
      {location: new google.maps.LatLng(29.831486925307292, -95.47497662716827), weight: 315.67725},
      {location: new google.maps.LatLng(29.536733723400623, -95.73004511620603), weight: 204.33375},
      {location: new google.maps.LatLng(29.64841905920222, -95.64693207301816), weight: 282.81825},
      {location: new google.maps.LatLng(30.750468077629655, -96.3168075455483), weight: 68.76475},
      {location: new google.maps.LatLng(29.40484254094217, -98.6372824624898), weight: 289.15375},
      {location: new google.maps.LatLng(27.73138303937778, -97.38682436046419), weight: 196.3325},
      {location: new google.maps.LatLng(30.34241699300664, -97.5308750181727), weight: 3.48025},
      {location: new google.maps.LatLng(32.941953891255906, -96.44755993197317), weight: 6.872},
      {location: new google.maps.LatLng(32.66078466934013, -96.87236188042287), weight: 156.95875},
      {location: new google.maps.LatLng(32.38955817479611, -94.69717653183369), weight: 44.86375},
      {location: new google.maps.LatLng(32.6662896897354, -97.41642008142428), weight: 154.47775},
      {location: new google.maps.LatLng(29.650406571697573, -95.51982555376605), weight: 143.1675},
      {location: new google.maps.LatLng(29.61902106088227, -95.2595994513876), weight: 254.27175},
      {location: new google.maps.LatLng(30.564881149479163, -96.25085838541665), weight: 4.20975},
      {location: new google.maps.LatLng(30.56752999853257, -96.29105008585786), weight: 432.03375},
      {location: new google.maps.LatLng(29.58016456896571, -98.40880981502247), weight: 349.60775},
      {location: new google.maps.LatLng(26.217134988708196, -98.24049857312069), weight: 470.556},
      {location: new google.maps.LatLng(26.266536524446575, -98.23535419298716), weight: 367.0215},
      {location: new google.maps.LatLng(30.541980121951056, -97.64035178260193), weight: 264.30175},
      {location: new google.maps.LatLng(30.24176126994551, -97.91974982346048), weight: 33.7205},
      {location: new google.maps.LatLng(31.07887242652955, -97.9596605143454), weight: 36.47875},
      {location: new google.maps.LatLng(31.114805441306693, -97.69056261554518), weight: 216.34025},
      {location: new google.maps.LatLng(31.41084921627618, -100.47972362677373), weight: 253.8745},
      {location: new google.maps.LatLng(29.74926376871436, -95.46963357037325), weight: 147.99625},
      {location: new google.maps.LatLng(29.787417278687418, -94.97018495818433), weight: 380.54625},
      {location: new google.maps.LatLng(30.03200255125392, -93.83614005152263), weight: 82.31825},
      {location: new google.maps.LatLng(29.973678112188853, -94.00183608365263), weight: 197.664},
      {location: new google.maps.LatLng(30.064851402010184, -94.17645424561462), weight: 171.50625},
      {location: new google.maps.LatLng(29.52046175554965, -98.60957438961324), weight: 287.3785},
      {location: new google.maps.LatLng(29.460285144139874, -98.67145781958956), weight: 342.39275},
      {location: new google.maps.LatLng(29.62828567862969, -98.62486607650895), weight: 67.7815},
      {location: new google.maps.LatLng(27.707833011429095, -97.35402470621747), weight: 125.04075},
      {location: new google.maps.LatLng(30.18354723631618, -97.89288060869502), weight: 96.30575},
      {location: new google.maps.LatLng(33.507191757935324, -101.93798000330834), weight: 361.20525},
      {location: new google.maps.LatLng(31.89268731076974, -102.35525813169599), weight: 319.502},
      {location: new google.maps.LatLng(32.556295071197816, -94.74016146682791), weight: 229.44775},
      {location: new google.maps.LatLng(29.655393575912804, -95.54275837670298), weight: 94.3995},
      {location: new google.maps.LatLng(29.578349224430383, -98.68809875847201), weight: 169.61575},
      {location: new google.maps.LatLng(30.078757114250237, -97.83505458001108), weight: 103.223},
      {location: new google.maps.LatLng(32.03746202259871, -102.08442720267), weight: 299.74975},
      {location: new google.maps.LatLng(32.2712990222162, -95.31433455901585), weight: 325.4645},
      {location: new google.maps.LatLng(29.743834329150392, -95.56007568253574), weight: 236.93625},
      {location: new google.maps.LatLng(29.73141832852711, -98.64778820419482), weight: 28.7795},
      {location: new google.maps.LatLng(29.550462542543798, -98.30630758932725), weight: 177.3945},
      {location: new google.maps.LatLng(31.918330385821147, -102.32362086775274), weight: 157.64075},
      {location: new google.maps.LatLng(31.67324030437223, -97.30953668251104), weight: 8.81075},
      {location: new google.maps.LatLng(29.543144758530264, -98.41832088802857), weight: 318.811},
      {location: new google.maps.LatLng(29.516714172706585, -98.35968095092831), weight: 219.3535},
      {location: new google.maps.LatLng(27.814658809101932, -97.51628168907766), weight: 56.1565},
      {location: new google.maps.LatLng(30.272333344703238, -97.74359316273484), weight: 84.15975},
      {location: new google.maps.LatLng(27.82515877138888, -97.39925108194447), weight: 5.68275},
      {location: new google.maps.LatLng(30.642259554625888, -97.64177177082439), weight: 3.481},
      {location: new google.maps.LatLng(29.383380322683138, -98.60763505260373), weight: 76.602},
      {location: new google.maps.LatLng(29.74618759523809, -98.07971505714288), weight: 1.034},
      {location: new google.maps.LatLng(32.01410305637014, -102.34812108037548), weight: 3.5305},
      {location: new google.maps.LatLng(29.708584941561185, -95.48309174725738), weight: 197.19},
      {location: new google.maps.LatLng(29.215137247733026, -98.37909320743375), weight: 1.641},
      {location: new google.maps.LatLng(29.3468821201581, -98.44409558616596), weight: 21.677},
      {location: new google.maps.LatLng(29.377878144720494, -98.5937494), weight: 15.6355},
      {location: new google.maps.LatLng(30.286409103061228, -97.73634964693875), weight: 23.635},
      {location: new google.maps.LatLng(32.3159535625, -95.25252321875), weight: 4.2275},
      {location: new google.maps.LatLng(32.43008914666667, -99.74999915999999), weight: 2.6475},
      {location: new google.maps.LatLng(33.58734922990654, -101.88124194579439), weight: 11.30425},
      {location: new google.maps.LatLng(29.75540555231432, -95.36619099106565), weight: 89.3385},
      {location: new google.maps.LatLng(31.815004463636356, -106.41991623667717), weight: 22.627},
      {location: new google.maps.LatLng(28.887340139253116, -96.82728924344406), weight: 1.16025},
      {location: new google.maps.LatLng(32.81528237859007, -96.87761525892081), weight: 263.60075},
      {location: new google.maps.LatLng(32.52527624554327, -94.57225622413797), weight: 41.417},
      {location: new google.maps.LatLng(31.403994308664917, -97.19366301040186), weight: 44.9605},
      {location: new google.maps.LatLng(29.689581832046933, -95.51043811187444), weight: 205.6295},
      {location: new google.maps.LatLng(29.588485802438058, -95.22518900456552), weight: 303.07625},
      {location: new google.maps.LatLng(30.658448270719685, -96.33229926888605), weight: 210.47975},
      {location: new google.maps.LatLng(27.548491652239793, -99.48460310914145), weight: 364.82275},
      {location: new google.maps.LatLng(29.496172147133933, -98.39948949854055), weight: 367.85075},
      {location: new google.maps.LatLng(29.653359313457955, -98.65593759691586), weight: 63.2035},
      {location: new google.maps.LatLng(29.686140860677504, -98.48817350004936), weight: 179.31625},
      {location: new google.maps.LatLng(30.3671636562521, -97.83773512913174), weight: 71.3385},
      {location: new google.maps.LatLng(33.44474654597458, -101.65697113952231), weight: 0.38925},
      {location: new google.maps.LatLng(32.021125737579524, -102.16418370621601), weight: 267.60925},
      {location: new google.maps.LatLng(31.782100859276664, -106.36327973023558), weight: 309.595},
      {location: new google.maps.LatLng(29.670940863185443, -95.5875441097896), weight: 261.634},
      {location: new google.maps.LatLng(29.695701352364647, -95.89118037286867), weight: 55.77375},
      {location: new google.maps.LatLng(30.09553514663119, -94.16522392076516), weight: 239.421},
      {location: new google.maps.LatLng(29.59032795723689, -98.23268701489644), weight: 262.033},
      {location: new google.maps.LatLng(27.887611842163135, -97.31797228943697), weight: 131.911},
      {location: new google.maps.LatLng(35.226324737403104, -101.67653958856592), weight: 30.46075},
      {location: new google.maps.LatLng(29.69919412529165, -95.53762163785576), weight: 358.76725},
      {location: new google.maps.LatLng(29.66183621995561, -95.28331791917881), weight: 197.12125},
      {location: new google.maps.LatLng(29.734961354762326, -95.52249062608233), weight: 208.3215},
      {location: new google.maps.LatLng(28.869503303191866, -97.00462234952083), weight: 254.17025},
      {location: new google.maps.LatLng(29.349571515340585, -98.2428345461362), weight: 0.17125},
      {location: new google.maps.LatLng(29.64405955459216, -98.60181394627486), weight: 89.6125},
      {location: new google.maps.LatLng(27.775367941943127, -97.5141379900474), weight: 22.776},
      {location: new google.maps.LatLng(30.365163851508814, -97.90022355332293), weight: 0.4735},
      {location: new google.maps.LatLng(33.493289676902315, -102.01098047304367), weight: 1.1215},
      {location: new google.maps.LatLng(29.424700768464728, -98.48808137026276), weight: 48.592},
      {location: new google.maps.LatLng(31.431638353846157, -100.41371584038458), weight: 7.969},
      {location: new google.maps.LatLng(32.69776446777176, -97.62157178470554), weight: 0.4785},
      {location: new google.maps.LatLng(32.77610130398861, -97.42685344700851), weight: 31.02725},
      {location: new google.maps.LatLng(32.874527913160875, -96.44405068206801), weight: 3.00975},
      {location: new google.maps.LatLng(30.336028615555556, -97.66515219777774), weight: 18.0985},
      {location: new google.maps.LatLng(31.07750591538461, -97.36187772051287), weight: 4.35275},
      {location: new google.maps.LatLng(32.899995252459, -97.0391459028688), weight: 49.366},
      {location: new google.maps.LatLng(32.81182283076924, -96.84036702692313), weight: 4.32025},
      {location: new google.maps.LatLng(35.2137134, -101.8836028), weight: 0.034},
      {location: new google.maps.LatLng(33.5914822, -101.8482778), weight: 0.29925},
      {location: new google.maps.LatLng(32.605132819527704, -95.10305997674837), weight: 0.02075},
      {location: new google.maps.LatLng(32.7352893, -97.110283), weight: 0.2385},
      {location: new google.maps.LatLng(31.79566733333333, -106.37625526666665), weight: 3.00375},
      {location: new google.maps.LatLng(31.46172555, -100.4459123), weight: 0.5135},
      {location: new google.maps.LatLng(31.54630795, -97.12365915), weight: 0.1775},
      {location: new google.maps.LatLng(33.58125, -101.8419758), weight: 0.84175},
      {location: new google.maps.LatLng(32.78143336666667, -96.8023909), weight: 0.2145},
      {location: new google.maps.LatLng(29.182513788133104, -98.4902926083757), weight: 0.09625},
      {location: new google.maps.LatLng(27.5300952, -99.46841793333336), weight: 0.0325},
      {location: new google.maps.LatLng(29.69273256666667, -95.19962176666665), weight: 1.2525},
      {location: new google.maps.LatLng(27.8794742, -97.0978885), weight: 0.05975},
      {location: new google.maps.LatLng(35.18839445714286, -101.8179027), weight: 0.03225},
      {location: new google.maps.LatLng(29.76738324285714, -95.3639725142857), weight: 1.8485},
      {location: new google.maps.LatLng(32.27435502724029, -94.9280186834259), weight: 0.05975},

  ]
}

//chloropleth
// Creating our initial map object
// We set the longitude, latitude, and the starting zoom level
// This gets inserted into the div with an id of 'cmap'

function getCMAP(){
  var cmap = new mapboxgl.Map({
    container: 'cmap', // container id
    style: 'mapbox://styles/ponchoms/cjjde7hls7vpw2rqhmpzc11a8' // replace this with your style URL
    });

    cmap.on('load', function() {
      // the rest of the code will go in here
      var layers = ['$0 - $20k', '$20k - $30k', '$30k - $45k', '$45k - $60k', '$60k - $75k', '$75k - $90k', '$90k+']      var colors = ['#ffff79', '#cbe259', '#96c53b', '#5fa81f', '#3d9810', '#0b8a00', '#096b00'];
      cmap.fitBounds([[-106.6,25.8],[-93.5,36.5]]);


      for (i = 0; i < layers.length; i++) {
        var layer = layers[i];
        var color = colors[i];
        var item = document.createElement('div');
        var key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;

        var value = document.createElement('span');
        value.innerHTML = layer;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
      }

      d3.select('#features').style("display","block")

    });

    cmap.on('mousemove', function(e) {
      var zips = cmap.queryRenderedFeatures(e.point, {
        layers: ['income-zipcode']
      });

      if (zips.length > 0) {
        document.getElementById('pd').innerHTML = '<h3><strong>$ <em>' + zips[0].properties['Avg. Income/H/hold'] + '</strong></h3><p><strong></em>' + '</h4>' +  zips[0].properties['City'] + ', ' + zips[0].properties['Zip Code'] ;
      }
    });

    cmap.getCanvas().style.cursor = 'default';
  }

/*
d3.json("/zip_data", createMarkers);

var theMap = L.map('mainMap').setView([29.7030, -98.1245], 11);

//need to hide
accessToken = 'pk.eyJ1IjoiYW5zZWxtMCIsImEiOiJjamgzamMzNXIwMzduMnhvM21nOHFnb2tkIn0.m5hJpyBF7EriYe1m2gYv7w'

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: accessToken
}).addTo(theMap);

function createMarkers(response) {
  console.log(response);

  //add the markers
  for (i = 0; i < 11; i++) {
    var marker = L.marker([response[i].lat_avg, response[i].lng_avg]).addTo(theMap).bindPopup("<h3>Existing Installs: " + response[i].existing_installs_count + "</h3><h3>Qualified: " + response[i].count_qualified + "</h3>");

  };

};

var zipStyle = {
  color: "white",
  fillColor: "yellow",
  fillOpacity: 0.5,
  weight: 1.5
};

/* // add the zip code boundaries layer
d3.json("/solar_data", function(data) {

  //console.log(data);
  L.geoJson(data, {
    style: zipStyle
  }).addTo(theMap);

}); */

//d3.json("../../data/tx_counties.geojson", function(county_data) {

  //console.log(county_data);
  //L.geoJson(county_data).addTo(theMap);

//}) */

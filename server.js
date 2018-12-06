'use strict';

const express=require('express');
const cors=require('cors');
const superagent=require('superagent');
const pg =require('pg');

require('dotenv').config();

const PORT= process.env.PORT||3000;
const app= express();
const client=new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err', err=> console.log(err));

app.use(cors());

app.get('/location',getLocation);
app.get('/weather',getWeather);
//app.get('/yelp',getYelp);

function handleError(err,res) {
    if(res) res.status(500).send('sorry stg is wrong')
}

app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});
///////////////LOCATION/////////////////////

function getLocation(request,response) {
    const locationHandler= {
        query: request.query.data,
        cacheHit: (results)=> {
            console.log('GOT DATA FROM SQL');
            response.send(results.rows[0]);
        },
        cacheMiss:()=> {
            Location.fetchLocation(request.query.data)
            .then(data => response.send(data));
        },
    };
    Location.takingLocation(locationHandler);
}

function Location(query,data) {
    this.search_query =query;
    this.formatted_query =data.formatted_address;
    this.latitude =data.geometry.location.lat;
    this.longitude=data.geometry.location.lng;
}

Location.prototype.save= function() {
    let SQL = `
        INSERT INTO locations
        (search_query,formatted_query,latitude,longitude)
        VALUES($1,$2,$3,$4)
        RETURNING id`;
    let values =Object.values(this);
    return client.query(SQL,values);
};

Location.fetchLocation =(query)=> {
    const _URL =`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
    return superagent.get(_URL)
    .then(data => {
        console.log('GOT data from API');
        if(!data.body.results.length) { throw 'no data';}
        else {
            let location = new Location(query, data.body.results[0]);
            return location.save()
            .then( result => {
                location.id = result.rows[0].id
                return location;
            })
        }
    });
};

Location.takingLocation = (handler) => {
    const SQL = `SELECT * FROM locations WHERE search_query=$1`;
    const values = [handler.query];
  
    return client.query( SQL, values )
      .then( results => {
        if( results.rowCount > 0 ) {
          handler.cacheHit(results);
        }
        else {
          handler.cacheMiss();
        }
      })
      .catch( console.error );
  };
  

  //////////////////////WEATHER///////////////////////////////////


  function getWeather(request,response) {
    const weatherHandler= {
        weather:request.query.data,
        cacheHit: function(results) {
            console.log('GOT DATA FROM SQL');
            response.send(results.rows);
        },
        cacheMiss:function() {
            Weather.fetch(request.query.data)
            .then(results => response.send(results))
            .catch(console.error);
        },
    };
    Weather.takingWeather(weatherHandler);
}

function Weather(day) {
    this.forecast=day.summary;
    this.time =new Date(day.time * 1000).toDateString;
}

Weather.prototype.save = function(id) {
    const SQL = 
        `INSERT INTO weathers
        (forecast,time,location_id) VALUES ($1,$2,$3);`;
        
    const values =Object.values(this);
    values.push(id);
     client.query(SQL, values);
};

Weather.takingWeather = function(handler) {
    const SQL = `SELECT * FROM weathers WHERE loaction_id=$1;`;
    client.query(SQL, [handler.weather.id])
      .then( results => {
        if( results.rowCount > 0 ) {
          handler.cacheHit(result);
        }
        else {
          handler.cacheMiss();
        }
      })
      .catch( error =>handleError(error));
    
    };
  


Weather.fetch =function(location )  {
    const URL =`https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
    return superagent.get(URL)
    .then(results => {
        console.log('GOT data from API');
        const allweather = results.body.daily.data.map(day => {
            const overallweather= new Weather(day);
            allweather.save(location.id);
            return overallweather;
        });
            
            return allweather;
        });
        //.catch(error => handleError(error));
    };



    ///////////////////YELP//////////////////

    // function getYelp(request,response) {
    //     const locationHandler= {
    //         query:request.query.data,
    //         cacheHit: (results)=> {
    //             console.log('GOT DATA FROM SQL');
    //             response.send(results.rows[0]);
    //         },
    //         cacheMiss:()=> {
    //             Location.fetchYelp(request.query.data)
    //             .then(data => response.send(data))
    //         },
    //     };
    //     Location.takingYelp(yelpHandler);
    // }
    
    // function Restaurant(business) {
    //     this.name = business.name;
    //     this.image_url = business.image_url;
    //     this.price = business.price;
    //     this.rating = business.rating;
    //     this.url = business.url;
    //   }
    
    // Restaurant.prototype.save= function() {
    //     let SQL = `
    //         INSERT INTO yelp
    //         (name,image_url,price,rating,url,loaction_id)
    //         VALUES($1,$2,$3,$4,$5,$6,$7)
    //         RETURNING id`;
    //     let values =Object.values(this);
    //     return client.query(SQL,values);
    // };
    
    // Restaurant.fetchBusiness =(query)=> {
    //     const _URL =`https://api.yelp.com/v3/businesses/search?location=${req.query.data.search_query}`;
    //     return superagent.get(_URL)
    //     .then(data => {
    //         console.log('GOT data from API');
    //         if(!data.body.results.length) { throw 'no data';}
    //         else {
    //             let restaurant = new business(query,data.body.results[0]);
    //             return restaurant.save()
    //             .then( result => {
    //                 location.id = result.rows[0].id
    //                 return restaurant;
    //             })
    //             return restaurant;
    //         }
    //     });
    // };
    
    // Restaurant.takingRestaurant = (handler) => {
    //     const SQL = `SELECT * FROM locations WHERE search_query=$1`;
    //     const values = [handler.query];
      
    //     return client.query( SQL, values )
    //       .then( results => {
    //         if( results.rowCount > 0 ) {
    //           handler.cacheHit(results);
    //         }
    //         else {
    //           handler.cacheMiss();
    //         }
    //       })
    //       .catch( console.error );
    //   };
      
    
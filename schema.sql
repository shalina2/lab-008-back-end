DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS weathers;
DROP TABLE IF EXISTS yelp;


CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(8, 6),
  longitude NUMERIC(9, 6)
);

CREATE TABLE weathers (
   id SERIAL PRIMARY KEY,
   forecast VARCHAR(255),
   time VARCHAR(255),
   location_id INTEGER NOT NULL,
   FOREIGN KEY (location_id) REFERENCES locations (id)

);

CREATE TABLE yelp (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  image_url VARCHAR(255),
  price VARCHAR(5),
  rating NUMERIC(3,2),
  url VARCHAR(255),
  location_id INTEGER NOT NULL,
   FOREIGN KEY (location_id) REFERENCES locations(id)
);


const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const path = require("path");
const databasePath = path.join(__dirname, "moviesData.db");

let database = null;
const intializerDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

intializerDBAndServer();

const convertSnakeCaseToCamelCase = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorToCamelCase = (dataObject) => {
  return {
    directorId: dataObject.director_id,
    directorName: dataObject.director_name,
  };
};

// get movie Name
app.get("/movies/", async (request, response) => {
  const getQuery = `SELECT *
     FROM movie;`;
  const getMovieDetails = await database.all(getQuery);
  const camelCaseDetails = getMovieDetails.map((eachOne) =>
    convertSnakeCaseToCamelCase(eachOne)
  );
  response.send(camelCaseDetails);
});

// post movie

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postQuery = `INSERT INTO
                movie (director_id, movie_name,lead_actor)
             VALUES
                (${directorId}, '${movieName}', '${leadActor}');`;
  const moviePost = await database.run(postQuery);
  response.send("Movie Successfully Added");
});

//get movieID

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieId = `SELECT *
             FROM movie
             WHERE movie_id = ${movieId};`;
  const movie = await database.get(getMovieId);
  response.send(convertSnakeCaseToCamelCase(movie));
});

//update movie

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateQuery = `UPDATE movie
             SET 
                director_id = ${directorId},
                movie_name = '${movieName}',
                lead_actor = '${leadActor}'
             WHERE movie_id = ${movieId};`;
  await database.run(updateQuery);
  response.send("Movie Details Updated");
});

//Delete movie

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM
                    movie
             WHERE 
                 movie_id = ${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//get directors

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT *
             FROM director;`;
  const directors = await database.all(getDirectorsQuery);
  const getEachDirectors = directors.map((eachOne) =>
    convertDirectorToCamelCase(eachOne)
  );
  response.send(getEachDirectors);
});

//get directorId & Movies

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const combineQuery = `SELECT movie.movie_name
             FROM movie 
                INNER JOIN director
                ON movie.director_id = director.director_id
            WHERE director.director_id = ${directorId};`;
  const getMovieName = await database.all(combineQuery);
  const convertMovieName = getMovieName.map((eachOne) =>
    convertSnakeCaseToCamelCase(eachOne)
  );
  response.send(convertMovieName.movieName);
});
module.exports = app;

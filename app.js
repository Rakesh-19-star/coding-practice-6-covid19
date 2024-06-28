const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
let db = null
const dbpath = path.join(__dirname, 'covid19India.db')

const initAndStartServerconnectDb = async () => {
  try {
    db = await open({filename: dbpath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('the server is running at htpps://localhost3000')
    })
  } catch (e) {
    console.log(`DB ERROR:${e.message}`)
  }
}
initAndStartServerconnectDb()

const dbObjectToStateResobj = dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  }
}

const dbObjectToDistrictResobj = dbobject => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  }
}
//api get stateobj
app.get('/states/', async (request, response) => {
  const getStatesQuery = ` 
    select 
    *
    from 
   state ;
    
  `
  const staeArray = await db.all(getStatesQuery)
  response.send(staeArray.map(dbObjectToStateResobj))
})

// state through sateid

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateByIdQuery = `
    select 
    *
    from 
    state
    where state_id=${stateId}
  `
  const state = await db.get(getStateByIdQuery)
  const stateres = dbObjectToStateResobj(state)
  response.send(stateres)
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updtaeQuery = `
    INSERT INTO district
    (district_name,state_id,cases,cured,active, deaths)
    VALUES
    (
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    )
  `
  const dbresponse = await db.run(updtaeQuery)
  const moviesId = dbresponse.lastID
  response.send(`District Successfully Added`)
})

//get district by ID
app.get('/districts/:districtsId/', async (request, response) => {
  const {districtsId} = request.params
  const getdistrictsIDByIdQuery = `
    select 
    *
    from 
    district
    WHERE district_id=${districtsId}
  `
  const district = await db.get(getdistrictsIDByIdQuery)
  response.send(dbObjectToDistrictResobj(district))
})

//deleting a district
app.delete('/districts/:districtsId/', async (request, response) => {
  const {districtsId} = request.params
  const deletedistrictsIDByIdQuery = `
    DELETE
    from 
    district
    where district_id=${districtsId}
  `
  await db.run(deletedistrictsIDByIdQuery)
  response.send('District Removed')
})

app.put('/districts/:districtsId/', async (request, response) => {
  const {districtsId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQueryofDistrict = `
    UPDATE district
    SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtsId}
  `
  await db.run(updateQueryofDistrict)
  response.send('District Details Updated')
})

//API ---7
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const selectStatsQuery = `
SELECT 
SUM(cases) AS totalCases,
SUM(cured) AS totalCured,
SUM(active) AS totalActive,
SUM(deaths) AS totalDeaths 
FROM 
district
WHERE 
state_id=${stateId} ;
`
  const res = await db.get(selectStatsQuery)
  response.send(res)
})

//API ___8
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
  SELECT state_name AS stateName FROM state JOIN district ON 
  state.state_id=district.state_id 
  WHERE 
  district.district_id=${districtId}
  `
  const statename = await db.get(stateDetails)
  response.send(statename)
})
module.exports = app

"use strict";
//**ROUTES FOR /jobs */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const { route } = require("./users");
const router = express.Router({ mergeParams: true });


//POST route job = { title, salary, equity, companyHandle }
//RETURNS { id, title, salary, equity, companyHandle } -> Admin.

router.post("/", ensureAdmin, async function(req, res, next){
  try {
    //run through Schema validation
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
})

// GET / {jobs: [{ id ,title, salary, equity, companyHandle, companyName }, ...] }
//Filters added -> minSalary, hasEquity, title
//no auth

router.get("/", async function (req, res, next) {
  //minEmployees, maxEmployees, nameLike object
  const filter = req.query; 
  //change to integers if defined.  '+' converts to integer, can use parseInt() as well. 
  if(filter.minSalary !== undefined) {filter.minSalary = +filter.minSalary};
  filter.hasEquity = filter.hasEquity === "true";

  //same try/catch style as company routes
  try {
    const validator = jsonschema.validate(filter, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    //if valid pass minSalary and hasEquity employeesinto findAll() class method in Job model
    const jobs = await Job.findAll(filter);
    //return json object. 
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

//GET /<jobId> 
//returns { d, title, salary, equity, company } WHERE company is {handle, name, description, numEmployees, logoUrl}
//no auth

router.get("/:id", async function(req, res, next){
  try{
    const job = await Job.get(req.params.id)
  } catch (err){
    return next(err);
  }
});

//PATCH ROUTE /<jobId>
//input can update { title, salary, equity }
//return updated job object Job.update(id, input)
//auth -> Admin

route.patch("/:id", ensureAdmin, async function(req, res, next){
  try{
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    //update job matching ID with input
    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  } catch (err){
    return next(err);
  }
});

//DELETE ROUTE /<id> -> Job.remove(id)
//return {deleted: <id>} //use + to convert string to positive integer(case insensitive). 
//auth - admin

route.delete("/:id", ensureAdmin, async function(req, res, next) {
  try{
    await Job.remove(req.params.id);
    return res.json({ deleted: +req.params.id })
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
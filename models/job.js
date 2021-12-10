"use strict"
const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { NotFoundError } = require("../expressError");

//Job class should pattern match the company model
//title, salary, equity, company_handle
class Job {
  static async create(input) {
    const result = await db.query(
      `INSERT INTO jobs (title,
                         salary,
                         equity,
                         company_handle) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
    [
      input.title,
      input.salary,
      input.equity,
      input.companyHandle
    ]);
    let job = result.rows[0];
    return job;
  }
  /*Similar to the companies filtering for the GET / route, add filtering for jobs for the following possible filters:
    title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
    minSalary: filter to jobs with at least that salary.
    hasEquity: if true, filter to jobs that provide a non-zero amount of equity. If false or not included
  in the filtering, list all jobs regardless of equity. */

  static async findAll({ title, minSalary, hasEquity } = {}){
    let buildQuery = `SELECT job.id,
                            job.title,
                            job.salary,
                            job.equity,
                            job.company_handle AS "companyHandle",
                            company.name AS "companyName"
                      FROM jobs job
                        LEFT JOIN companies AS company ON company.handle = job.company_handle`;
    let queryString = []; //array to store strings for Query building
    let values = []; //array to store values to plug into string for Query
    
    //generate SQL query string based on input to account for variables:
    // salary >= values.length
    if (minSalary !== undefined) {
      values.push(minSalary);
      queryString.push(`salary >= $${values.length}`);
    }
    //equity > 0
    if (hasEquity === true) {
      queryString.push(`equity > 0`);
    }
    // name ILIKE values.length; --ILIKE ignores case whereas LIKE uses case
    if (title !== undefined) {
      values.push(`%${title}%`);
      queryString.push(`title ILIKE $${values.length}`);
    }
    //WHERE queryString AND 
    if (queryString.length > 0) {
      query += " WHERE " + queryString.join(" AND ");
    }

    // append for ORDER BY title and return. 

    buildQuery += " ORDER BY title";
    //query the completed string literal using the inputed values for $1, $2, etc that are stored in the values array
    const jobs = await db.query(buildQuery, values);
    return jobs.rows;
  }
  //Returns { id, title, salary, equity, companyHandle, company }
  //   where company is { handle, name, description, numEmployees, logoUrl }
  //Throws NotFoundError if not found.
  //uses company model style handles both table queries.
  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  //Updating a job should never change the ID of a job, nor the company associated with a job.
  //use company.js model for example. 
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
        //assign numerical variables to $ for input into SQL string. 
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  //DELETE a job from id, throw error if not found. -> use company model
  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
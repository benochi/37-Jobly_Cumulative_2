const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/*
A function can call this function to make the "SET" clause for an SQL UPDATE statement.
this allows individual column names to be updated with values. 

dataToUpdate = {object} this will pass in the user input. 
EXAMPLE OBJECT: {field1: inputValue1, field2: inputValue2, etc} 

jsToSql = {Object} which maps a js data field to column names.
EXAMPLE OBJECT: {firstName: "first_name", age: "age"}

returns {Object}

usage = {firstName: 'Bob', age: 40}, 
  { setCols: `"first_name"= $1, "age"=$2`, values: ['Bob', 40] }
*/ 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

//Import paginator middleware
//Phase 10
const {paginator} = require('../utils/pagination');

// Import model(s)
const { Student, Classroom, StudentClassroom } = require('../db/models');
const { Op } = require("sequelize");

// List
router.get('/', paginator, async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    //Phase 10
    const limit = req.limit;
    const offset = req.offset;
    const page = req.page;

    // Phase 2A: Use query params for page & size
    // let page = parseInt(req.query.page);
    // let limit = parseInt(req.query.size);
    // if(page === undefined || isNaN(page) || page === 0) page = 1;
    // if(limit === undefined || isNaN(limit)) limit = 10;
    // let offset;
    const studentCount = await Student.count();

    // Phase 2B: Calculate limit and offset
    // Phase 2B (optional): Special case to return all students (page=0, size=0)
    // Phase 2B: Add an error message to errorResult.errors of
        // 'Requires valid page and size params' when page or size is invalid
    // if(page === 0 && limit === 0) {
    //     limit = null;
    //     offset = 0;
    //     page = 1;
    // } else if (page > 0 || limit > 0) {
    //     offset = limit * (page - 1);
    // }
    if(offset >= studentCount) {
        errorResult.errors.push({message:'Requires valid page and size params'})
    }

    // Phase 4: Student Search Filters
    /*
        firstName filter:
            If the firstName query parameter exists, set the firstName query
                filter to find a similar match to the firstName query parameter.
            For example, if firstName query parameter is 'C', then the
                query should match with students whose firstName is 'Cam' or
                'Royce'.

        lastName filter: (similar to firstName)
            If the lastName query parameter exists, set the lastName query
                filter to find a similar match to the lastName query parameter.
            For example, if lastName query parameter is 'Al', then the
                query should match with students whose lastName has 'Alfonsi' or
                'Palazzo'.

        lefty filter:
            If the lefty query parameter is a string of 'true' or 'false', set
                the leftHanded query filter to a boolean of true or false
            If the lefty query parameter is neither of those, add an error
                message of 'Lefty should be either true or false' to
                errorResult.errors
    */
    const where = {};
    const {firstName, lastName, lefty} = req.query;
    if(firstName) {
        where.firstName = {
            [Op.substring]: firstName
        }
    }
    if(lastName) {
        where.lastName = {
            [Op.substring]: lastName
        }
    }
    if(lefty) {
        if(lefty === "true") {
            where.leftHanded = Boolean(lefty);
        } else if(lefty === "false"){
            where.leftHanded = {
                [Op.not]: true
            }
        } else {
            //Strings other than true or false
            errorResult.errors.push("Lefty should be either true or false")
        }
    }





    // Phase 2C: Handle invalid params with "Bad Request" response
    // Phase 3C: Include total student count in the response even if params were
        // invalid
        /*
            If there are elements in the errorResult.errors array, then
            return a "Bad Request" response with the errorResult as the body
            of the response.

            Ex:
                errorResult = {
                    errors: [{ message: 'Grade should be a number' }],
                    count: 267,
                    pageCount: 0
                }
        */
    errorResult.count = studentCount;
    if(errorResult.errors.length > 0) {
        return res.status(400).json(errorResult);
    }

    let result = {};

    // Phase 3A: Include total number of results returned from the query without
        // limits and offsets as a property of count on the result
        // Note: This should be a new query
    result.count = await Student.count({
        where: where
    });

    result.rows = await Student.findAll({
        attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
        where: where,
        //Phase 1A
        order: [['lastName'], ['firstName']],
        limit: limit,
        offset: offset,
        //Phase 8B
        include: [
            {
                model: Classroom,
                attributes: ['id', 'name'],
                through: {
                    attributes:['grade']
                }
            }
        ],
        order: [[Classroom, StudentClassroom, 'grade', 'DESC']]
    });

    // Phase 2E: Include the page number as a key of page in the response data
        // In the special case (page=0, size=0) that returns all students, set
            // page to 1
        /*
            Response should be formatted to look like this:
            {
                rows: [{ id... }] // query results,
                page: 1
            }
        */
    result.page = page;

    // Phase 3B:
        // Include the total number of available pages for this query as a key
            // of pageCount in the response data
        // In the special case (page=0, size=0) that returns all students, set
            // pageCount to 1
        /*
            Response should be formatted to look like this:
            {
                count: 17 // total number of query results without pagination
                rows: [{ id... }] // query results,
                page: 2, // current page of this query
                pageCount: 10 // total number of available pages for this query
            }
        */
    result.pageCount = Math.ceil(result.count/limit);

    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;

// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Supply, Classroom, Student } = require('../db/models');

// Import op
const{Op} = require("Sequelize");

// List of supplies by category
router.get('/category/:categoryName', async (req, res, next) => {
    // Phase 1C:
    // Find all supplies by category name
    try{
        const supplies = await Supply.findAll({
            attributes: ['id', 'category', 'name', 'handed'],
            where: {
                category: req.params.categoryName
            },
            // Phase 8A:
            // Include Classroom in the supplies query results
            include: [
                {
                    model: Classroom,
                    attributes: ['id', 'name']
                }
            ],
            // Order nested classroom results by name first then by supply name
            order: [[Classroom, 'name'], ['name']]

            // Order results by supply's name then handed -- demonstrated in previous phase
        });
        if(supplies.length > 0) {
            // Return the found supplies as the response body
            res.json(supplies);
        } else {
            throw new Error(`No supplies found with category name ${req.params.categoryName}`)
        }

    } catch (err) {
        next(err);
    }


});


// Scissors Supply Calculation - Business Logic Goes Here!
router.get('/scissors/calculate', async (req, res, next) => {
    let result = {};

    // Phase 10A: Current number of scissors in all classrooms
        // result.numRightyScissors should equal the total number of all
            // right-handed "Safety Scissors" currently in all classrooms
        // result.numLeftyScissors should equal the total number of all
            // left-handed "Safety Scissors" currently in all classrooms
        // result.totalNumScissors should equal the total number of all
            // "Safety Scissors" currently in all classrooms, regardless of
            // handed-ness
    result.numRightyScissors = await Supply.count({
        where: {
            name:  "Safety Scissors",
            handed: "right"
        }
    })
    result.numLeftyScissors = await Supply.count({
        where: {
            name:  "Safety Scissors",
            handed: "left"
        }
    })
    result.totalNumScissors = result.numRightyScissors + result.numLeftyScissors;

    // Phase 10B: Total number of right-handed and left-handed students in all
        // classrooms
        // result.numRightHandedStudents should equal the total number of
            // right-handed students in all classrooms
            // Note: This is different from the total amount of students that
                // are right-handed in the database. This is a total of all
                // right-handed students in each classroom combined. Some
                // students are enrolled in multiple classrooms, so if a
                // right-handed student was enrolled in 3 classrooms, that
                // student would contribute to 3 students in the total amount of
                // right-handed students in all classrooms.
        // result.numLeftHandedStudents should equal the total number of
            // left-handed students in all classrooms
    result.numRightHandedStudent = await Classroom.count({
        include: {
            model: Student,
            where: {
                leftHanded: {
                    [Op.not]: true
                }
            }
        }
    });

    result.numLeftHandedStudent = await Classroom.count({
        include: {
            model: Student,
            where: {
                leftHanded: true
            }
        }
    });



    // Phase 10C: Total number of scissors still needed for all classrooms
        // result.numRightyScissorsStillNeeded should equal the total number
            // of right-handed scissors still needed to be added to all the
            // classrooms
            // Note: This is the number of all right-handed students in all
                // classrooms subtracted by the number of right-handed scissors
                // that all the classrooms already have.
        // result.numLeftyScissorsStillNeeded should equal the total number
            // of left-handed scissors still needed to be added to all the
            // classrooms
    result.numRightyScissorsStillNeeded = result.numRightHandedStudent - result.numRightyScissors;

    result.numLeftyScissorsStillNeeded = result.numLeftHandedStudent - result.numLeftyScissors;

    res.json(result);
});

// Export class - DO NOT MODIFY
module.exports = router;

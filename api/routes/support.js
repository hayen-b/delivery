var express = require('express');
var listTicketRouter = express.Router();
var writeTicketRouter = express.Router();
var getTicketRouter = express.Router();
var issueWarningRouter = express.Router();
var assignTicketRouter = express.Router();
const getPool = require('../db');
var pool = getPool();

writeTicket = (request, response) => {
    date = request.body.date;
    subject = request.body.subject;
    content = request.body.content;
    console.log(request.session.user);
    username = request.session.user.username;
    type = request.session.user.type;
    

    if (type.localeCompare("Customer") == 0) {
        pool.query("INSERT INTO SupportTicket VALUES(DEFAULT, $1, $2, $3, NULL) RETURNING ticket_id", [date, subject, content], (error, result) => {
            if (error) {
                release();

                response.status(401).send("Error Creating Support Ticket");
            }
            else {
                console.log(result.rows);
                newlyInsertedTicketId = result.rows[0].ticket_id;
                is_food = request.body.is_food;
                order_id = request.body.order_id;
                if(is_food){
                    pool.query("INSERT INTO HasTicket VALUES($1, $2)", [newlyInsertedTicketId, order_id], (error1, result) => {
                        if (error1) {
                            release();
                            console.log(newlyInsertedTicketId);
    
                            response.status(401).send("Error Creating Support Ticket");
                        }
                        
                    } )
                }
               
                pool.query("INSERT INTO SubmitTicket VALUES($1, $2)", [newlyInsertedTicketId, username], (error1, result) => {
                    if (error1) {
                        console.log(newlyInsertedTicketId);

                        response.status(401).send("Error Creating Support Ticket");
                    }
                    else {
                        response.status(200).send("Support Ticket Successfully Created");
                    }
                } )
            }
        } )
    }
    else if(type.localeCompare("SupportStaff") == 0){
        
        supportResponse = request.body.supportResponse;
        pool.query("UPDATE SupportTicket SET response = $1 WHERE EXISTS(SELECT * FROM AssignedToTicket NATURAL JOIN SupportTicket WHERE response = NULL AND username = $2)",
            [supportResponse, username], (error, result) => {
                if (error) {
                    release();

                        response.status(401).send("Error Answering Support Ticket")
                }
                else {
                    pool.query("UPDATE SupportStaff SET is_free = true WHERE username=$1",
                    [username], (error, result) => {
                        if (error) {
                            release();

                            response.status(401).send("Error Freeing Support Staff")
                        }
                        else {
                            release();

                            response.status(200).send("Response Sent for the Support Ticket");
                        }
                    })
                }
            })
    }
    else {
        response.status(401).send("Wrong User Type for SupportTicket")
    }

}

assignTicket = (ticket_id) => {
    pool.query("SELECT FIRST(username) FROM SupportStaff WHERE is_free = true", (error1, freeSupport) => {
        if (error1) {
            console.log(error1);
            //response.status(401).send("Error Assigning Support Ticket")
        }
        else {
            pool.query("UPDATE SupportStaff SET is_free = false WHERE username = $1", [freeSupport.rows[0].username], (error2, result2) => {
                if (error2) {
                    //response.status(401).send("Error Assigning Support Ticket")
                }
                else {
                    pool.query("INSERT INTO AssignedToTicket VALUES($1, $2)", [ticket_id, freeSupport.rows[0].username], (error3, result3) => {
                        if (error3) {
                            //response.status(401).send("Error Assigning Support Ticket")
                        }
                        else {
                            //response.status(200).send("Support Ticket Successfully Assigned");
                        }
                    })
                }
            })
        }
    } )
}

getTicket = (request, response) => {
    ticket_id = request.query.ticket_id;
    pool.query("SELECT * FROM SupportTicket WHERE ticket_id = $1", [ticket_id], (error, result) => {
        if (error) {
            console.log(error);
            response.status(401).send("Error Returning Support Ticket");
        }
        else {
            response.status(200).send(result.rows);
        }
    })
}

listTickets = (request, response) => {
    username = request.body.username;
    if( type.localeCompare("Customer") == 0 ) {
        pool.query("SELECT * FROM SubmitTicket WHERE username = $1", [username], (error, result) => {
            if (error) {
                response.status(401).send("Error Listing Support Tickets");
            }
            else {
                response.status(200).send(result.rows);
            }
        });
    }
    else if( type.localeCompare("SupportStaff") == 0 ) {
        pool.query("SELECT * FROM RespondTicket WHERE username = $1", [username], (error, result) => {
            if (error) {
                response.status(401).send("Error Listing Support Tickets");
            }
            else {
                response.status(200).send(result.rows);
            }
        });
    }
    else {
        response.status(401).send("The user type is not authorized for tickets");
    }
}


issueWarning = (request, response) => {
    username = request.query.username;
    ownername = request.query.ownername;
    issue_time = request.query.issue_time;
    pool.query("INSERT INTO IssueWarning VALUES($1, $2, $3)", [username, ownername, issue_time], (error, result) => {
        if (error) {
            console.log(error);
            response.status(401).send("Error Issuing Warning")
        }
        else {
            pool.query("UPDATE RestaurantOwner SET warning_count = warning_count + 1 WHERE username = $1", [ownername], (error2, result2) => {
                if (error2) {
                    console.log(error2);
                    response.status(401).send("Error Issuing Warning")
                }
                else {
                    response.status(200).send("Warning Successfully Issued");
                }
            })
        }
    })
}


writeTicketRouter.post('/support/listtickets', listTickets);
writeTicketRouter.post('/support/writeticket', writeTicket);
getTicketRouter.get('/support/getticket', getTicket);
issueWarningRouter.get('/support/warn', issueWarning);
assignTicketRouter.get('/support/assignTicket', assignTicket);

module.exports = {
    listTicketRouter,
    writeTicketRouter,
    getTicketRouter,
    issueWarningRouter,
    assignTicketRouter
};
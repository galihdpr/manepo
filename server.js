const express = require('express');
const mysql = require('mysql2');
const server = express();
const session = require('express-session');
server.use(express.static('public'));
server.use(express.urlencoded({extended:false}));



// below here would be database connection setup

let config = {};

if(process.env.NODE_ENV === 'production'){
    config.connectionLimit= 250;
    config.user= process.env.cloud_sql_username;
    config.password= process.env.cloud_sql_pass;
    config.database= process.env.cloud_sql_database;
    config.socketPath = "/cloudsql/manepo-service:asia-southeast1:database48";
}else{
    config.connectionLimit= 250;
    config.user= '.....';
    config.password= '......';
    config.database= '......';
    config.port='.....';
    config.host = '....';
}
const pool = mysql.createPool(config);
// above these would be database connecton setup

// set up to maintain session management
server.use(
    session({
        secret: 'secret',
        resave: 'false',
        saveUninitialized: 'false'
    })
);

//set up middleware to control and check login
server.use((req, res, next)=>{
    if(req.session.username === undefined){
        console.log('You are not logged in');
        res.locals.userName = 'Guest';
        res.locals.isLoggedIn = false;
    }else{
        console.log('You are logged process');
        console.log(process.env.cloud_sql_database);
        res.locals.userName = req.session.username;
        res.locals.isLoggedIn = true;
    }
    next();
});


//get index page
server.get('/', (req,res)=>{
    res.render('index.ejs');
});

// trial please login page
server.get('/nologin', (req, res)=>{
    res.render('nologin.ejs');
})
//get input po page
server.get('/inputpo',(req,res)=>{
    if(res.locals.isLoggedIn === false){
        res.redirect('/nologin');
    }else{
        res.render('inputPo.ejs');
    }
});
//post new po information
server.post('/inputpo', (req, res)=>{
    pool.query(
        'INSERT INTO purchase_order_table(agreement,customer_name,cmo,dealer) VALUES(?,?,?,?)',
        [req.body.agreement, req.body.customer_name, req.body.cmo, req.body.dealer],
        (error, results)=>{
            if(error){
                console.error(error);
            }else{
                res.redirect('/displaypo');
            }
        }
    );
});

// get input jiwa insurance page 
server.get('/inputinsco1',(req,res)=>{
    if(res.locals.isLoggedIn === false){
        res.redirect('/nologin');
    }else{
        res.render('inputinsco1.ejs');
    }
});
// display insco input life insurance 
server.post('/inputinsco1', (req, res)=>{
    pool.query(
        'INSERT INTO insco_jiwa(agreement, customer_name, insco, tgl_report_claim, pelapor, relasi_pelapor, penyebab_meninggal, meninggal_di, kelengkapan, keterangan) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [req.body.agreement,req.body.customer_name, req.body.insco, req.body.tgl_report_claim, req.body.pelapor, req.body.relasi_pelapor, req.body.penyebab_meninggal, req.body.meninggal_di, req.body.kelengkapan, req.body.keterangan],
        (error, results)=>{
            if(error){
                console.error(error);
            }else{
                res.redirect('/displayinsco1');
            }
        }
    );
});

server.get('/inputinsco2', (req, res)=>{
    if(res.locals.isLoggedIn === false){
        res.redirect('/nologin');
    }else{
        res.render('inputinsco2.ejs');
    }
});

// send form data to insco unit
server.post('/inputinsco2', (req, res)=>{
    pool.query(
        'INSERT INTO insco_unit(agreement, customer_name, insco, tgl_report_claim, pelapor, relasi_pelapor, bengkel, tgl_kejadian, kelengkapan, keterangan) VALUES(?,?,?,?,?,?,?,?,?,?)',
        [req.body.agreement, req.body.customer_name,req.body.insco, req.body.tgl_report_claim, req.body.pelapor, req.body.relasi_pelapor, req.body.bengkel, req.body.tgl_kejadian, req.body.kelengkapan, req.body.keterangan],
        (error, results)=>{
            if(error){
                console.error(error);
            }else{
                res.redirect('/displayinsco2');
            }
        }
    );
});

//get display po page
server.get('/displaypo',(req,res)=>{
    if(res.locals.isLoggedIn === false){
        res.redirect('/nologin');
    }else{
        pool.query(
            'SELECT * FROM purchase_order_table',
            (error,results)=>{
                if(error){
                    console.error(error);
                    return;
                }else{
                res.render('display-po.ejs',{listpo : results});
                }
            }    
        );                
    }
});

//get display life insurance insco page
server.get('/displayinsco1',(req,res)=>{
        if(res.locals.isLoggedIn === false){
            res.redirect('/nologin');
        }else{
            pool.query(
                'SELECT * FROM insco_jiwa',
            (error, results)=>{
                if(error){
                    console.error(error);
                    return;
                }else{
                    res.render('displayinsco1.ejs', {inscolist : results});
                }
            });    
        }        
    });

// get display unit insurance insco page
server.get('/displayinsco2', (req,res)=>{
    if(res.locals.isLoggedIn === false){
        res.redirect('/nologin');        
    }else{
        pool.query(
            'SELECT * FROM insco_unit',
            (error, results)=>{
                if(error){
                    console.error(error);
                    return;
                }else{
                    res.render('displayinsco2.ejs', {inscolist:results});
                }
            });
        }
    });

//delete for po
server.post('/deletepo/:po_id', (req,res)=>{
    pool.query(
        'DELETE FROM purchase_order_table WHERE po_id = ?',
        [req.params.po_id],
        (error, results)=>{
            res.redirect('/displaypo');
        }
    );
});

// delete for life insco
server.post('/deleteinsco1/:claim_j_id', (req, res)=>{
    pool.query(
        'DELETE FROM insco_jiwa WHERE claim_j_id = ?',
        [req.params.claim_j_id],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.redirect('/displayinsco1');
            }
        }
    );
});

//delete for unit insco
server.post('/deleteinsco2/:claim_u_id', (req,res)=>{
    pool.query(
        'DELETE FROM insco_unit WHERE claim_u_id = ?',
        [req.params.claim_u_id],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.redirect('/displayinsco2');
            }
        }
    );
});

// edit route purchase order
server.get('/editpo/:po_id', (req,res)=>{
    pool.query(
        'SELECT * FROM purchase_order_table WHERE po_id = ?',
        [req.params.po_id],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.render('editPo.ejs',{polist : results[0]});
            }
        }
    );
});

// send edited purchase order information
server.post('/updatepo/:po_id',(req,res)=>{
    pool.query(
        'UPDATE purchase_order_table SET agreement = ?, customer_name = ?, cmo=?, dealer=?,status_po=?,tgl_cetak_po=?,tgl_ambil_po=? WHERE po_id=?',
        [req.body.agreement,req.body.customer_name, req.body.cmo, req.body.dealer, req.body.status_po, req.body.tgl_cetak_po, req.body.tgl_ambil_po, req.params.po_id],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.redirect('/displaypo');
            }
        }
    );
});

// get edit insco life page
server.get('/editinsco1/:claim_j_id',(req,res)=>{
    pool.query(
        'SELECT * FROM insco_jiwa WHERE claim_j_id = ?',
        [req.params.claim_j_id],
        (error,results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.render('editInsco1.ejs',{claimlist:results[0]});
            }
        }
    );
});

// send post edited insco1 page
server.post('/updateinsco1/:claim_j_id', (req,res)=>{
    pool.query(
        'UPDATE insco_jiwa SET agreement=?,customer_name=?,insco=?,tgl_report_claim=?,pelapor=?,relasi_pelapor=?,penyebab_meninggal=?,meninggal_di=?,kelengkapan=?,keterangan=? WHERE claim_j_id =?',
        [req.body.agreement, req.body.customer_name,req.body.insco, req.body.tgl_report_claim,req.body.pelapor,req.body.relasi_pelapor,req.body.penyebab_meninggal,req.body.meninggal_di,req.body.kelengakapan,req.body.keterangan, req.params.claim_j_id],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.redirect('/displayinsco1');
            }
        }
    );
});

//get edit insco2 page
server.get('/editinsco2/:claim_u_id', (req,res)=>{
    pool.query(
        'SELECT * FROM insco_unit WHERE claim_u_id = ?',
        [req.params.claim_u_id],
        (error,results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.render('editInsco2.ejs',{claimlist:results[0]});
            }
        }
    );
});

// send updated insco unit information
server.post('/updateinsco2/:claim_u_id', (req, res)=>{
    pool.query(
        'INSERT INTO insco_unit SET agreement=?,customer_name=?,insco=?,tgl_report_claim=?,pelapor=?,relasi_pelapor=?, bengkel=?,tgl_kejadian=?,kelengkapan=?,keterangan=? WHERE claim_u_id=?',
        [req.body.agreement,req.body.customer_name,req.body.insco,req.body.tgl_report_claim,req.body.pelapor,req.body.relasi_pelapor,req.body.bengkel,req.body.tgl_kejadian,req.body.kelengkapan,req.body.keterangan,req.params.claim_u_id],
        (error,results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                res.redirect('/displayinsco2');
            }
        }
    )
})
// get display login page
server.get('/login', (req,res)=>{
    res.render('login.ejs');
});

//get logout process
server.get('/logout', (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.error(err);
        }else{
            res.redirect('/');
        }
    });
});
// set route path to receive data from login page
server.post('/login', (req, res)=>{
    pool.query(
        'SELECT * FROM user_data WHERE username = ?',
        [req.body.username],
        (error, results)=>{
            if(error){
                console.error(error);
                return;
            }else{
                if(results.length>0){
                    if(req.body.password === results[0].password){
                        // if authentification success, save session Id using registration number
                        req.session.noreg = results[0].noReg;
                        req.session.username = results[0].username;
                        console.log(req.session.username);
                        res.redirect("/");
                    }else{
                        //console.log("Authentification failed!");
                        res.redirect("/login");
                    }
                }
            }
        });
    });               

server.listen(process.env.PORT||3000);

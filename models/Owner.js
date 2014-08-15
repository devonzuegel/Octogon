var passport = require('passport');
var mongoose = require('mongoose/');

var CompanyModel = require('../models/Company.js'),
    Companies = CompanyModel.Companies;

var Schema = mongoose.Schema;
var OwnerSchema = new Schema({
    name: String,
    companies: 'object',
    class_name: String,
    email: String,
    img_path: String
  }, 
  {
    collection: 'owners'
  });
var Owners = mongoose.model('owners', OwnerSchema);


function add(name, email, companies, cb) {

  /* In the case that there is only one company selected, the form
   * returns us a string rather than an array. This line converts it
   * into an array of length 1. */
  if (typeof companies === 'string')  companies = [companies];
  if (companies == undefined)         companies = [];
  
  // build up owner hash with details from above
  var owner = { 
    'name': name,
    'email': email,
    'companies': companies
  };

  // Create new company with info from owner hash
  Owners.create(owner, function (err, o) {
    if (err)  return done(err);

    /* after owner is added to db, update the selected companies to indicate 
     * (s)he is one of their owners & then redirect to settings page */
    if (o.companies) {
      for (var i = 0; i < o.companies.length; i++) {
        var username = o.companies[i];

        Companies.findOne({username: username}, function(err, c) {
          var owners = (c.owners) ? JSON.parse(c.owners) : [];
          owners.push(o.id);
          c['owners'] = JSON.stringify(owners);
          c.save();
        });
      }

      cb(o);
    }
  });
}

function edit (id, form, cb) {
  // search for owner to update (based on id, found in hidden input element)
  Owners.findOne({ _id: id }, function (err, o) {
    // update fields
    for (var k in form)   o[k] = form[k];

    /* after owner's companies list is updated, update companies to indicate 
     * person is(n't) one of their owners & then redirect to settings page */
    o.save(function() {     
      var owners_companies = o.companies;

      Companies.find({}, function(err, all_companies) {

        for (var i = 0; i < all_companies.length; i++) {
          // retrieve ith company from all_companies array for inspection
          var c = all_companies[i];

          // get & parse the stringified list of c's owners
          // if the list is undefined, create an empty array
          var companys_owners = (c.owners && c.owners!='') ? JSON.parse(c.owners) : [];

          /** info about existence/locatn of owner in list of company's owners **/
          // retrieve index of this owner in the list of c's owners
          var i_owner = companys_owners.indexOf(o.id);
          // true if owner is in list of company's owners, else false
          var o_in_list = (i_owner != -1  ||  companys_owners == o.name);

          /** info about existence/locatn of c in list of owner's companies **/
          // retrieve index of this company in the list of this owner's companies
          var i_company = owners_companies.indexOf(c.username);
          // true if company is in list of owner's company, else false
          var c_in_list = (i_company != -1  ||  owners_companies == c.username);


          /* if (the company can be found in the list of the owner's companies)
           * AND if the owner isn't in the list of its company's owners, add it */
          if (c_in_list  &&  !o_in_list)    companys_owners.push(o.id);
          /* else (the company can't be found in the list of the owner's companies)
           * ... if the owner is in the list of its company's owners, remove it */
          if (o_in_list  &&  !c_in_list)    companys_owners.splice(i_owner, 1);

          console.log('companys_owners:  %s', companys_owners);
          // update c.owners to reflect changes
          c['owners'] = JSON.stringify(companys_owners);
          c.save();
        }
        
      });

      cb();
    }); // END OF o.save(..)
  }); // END OF Owner.findOne(..)
}


module.exports.add = add;
module.exports.edit = edit;
module.exports.Owners = Owners;

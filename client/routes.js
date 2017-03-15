/**
 * Created by Jonathan on 3/11/2017.
 */

Router.configure({
    layoutTemplate: 'layout'
});

Router.route('/', function () {
    this.render('landing_page');
    Session.set(CURRENT_PAGE_KEY, HOME_PAGE_KEY);
});

Router.route('/design/:_id', function () {
    var airfoil_id = this.params._id;
    console.log("Routing to airfoil: ", airfoil_id);

    if (airfoil_id == 'default' || airfoil_id == ""){
        Session.set('airfoil_id', 'default');
    } else {
        var temp_airfoil = Airfoils.findOne({_id: airfoil_id});
        if (!temp_airfoil){
            console.log('Unable to find airfoil. There was a problem with the ID.');
            return;
        }
        Session.set('airfoil_id', airfoil_id);
    }
    this.render('design_page');
});

Router.route('/public_airfoils', function () {
    this.render('public_airfoils');
    Session.set(CURRENT_PAGE_KEY, PUBLIC_PAGE_KEY);
});

Router.route('/mydesigns', function () {
    this.render('portfolio');
});

Router.route('/home', function () {
    this.render('landing_page');
    Session.set(CURRENT_PAGE_KEY, HOME_PAGE_KEY);
});


/**
 * Created by Jonathan on 3/11/2017.
 */
Router.configure({
    layoutTemplate: 'layout'
});
Router.route('/', function () {
    this.render('design_page');
});
Router.route('/design', function () {
    this.render('design_page');
});
Router.route('/public_airfoils', function () {
    this.render('public_airfoils');
});
Router.route('/mydesigns', function () {
    this.render('portfolio');
});
Router.route('/home', function () {
    this.render('landing_page');
});


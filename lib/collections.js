/**
 * Created by Jonathan on 3/11/2017.
 */
Airfoils = new Mongo.Collection("airfoils");

// PAGE KEY CONSTANTS
// These will be used to identify which page you are on.
CURRENT_PAGE_KEY = 'current_page';
AIRFOIL_KEY = 'airfoil_id';
DUPLICATE_KEY = 'draw_duplicate';
HOME_PAGE_KEY = 'home';
DESIGN_PAGE_KEY = 'design';
PUBLIC_PAGE_KEY = 'public_airfoils';

// OTHER CONSTANTS
DEFAULT_AIRFOIL_KEY = 'default';

// SESSION VAR NAMES
AIRFOIL_NAME_KEY = 'airfoil_name';
IS_PRIVATE_KEY = 'private_airfoil';
AIRFOIL_ID = 'airfoil_id';
AIRFOIL_CREATOR = 'airfoil_creator';
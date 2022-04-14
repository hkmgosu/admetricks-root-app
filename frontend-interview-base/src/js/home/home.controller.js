class HomeCtrl {
  constructor(AppConstants) {
    'ngInject';

    this.appName = AppConstants.appName;

  }

  changeList(newList) {
    this._$scope.$broadcast('setListTo', newList);
  }


}

export default HomeCtrl;

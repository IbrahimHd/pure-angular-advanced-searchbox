'use strict';

/**
 * @ngdoc function
 * @name app.controller:AppCtrl
 * @description
 * # AppCtrl
 * Main controller for our application
 */

angular.module('app')

  .controller('AppCtrl', [
    '$scope',
    '$timeout',
    function ($scope, $timeout) {

      $scope.sOptions = {

      };

      $scope.$watch('sOptions', function (__new) {

        console.log(__new);

      }, true);

      $scope.sFilters = [
        {
          'name': 'example',
          'displayName': 'Example',
          'dontFilter': true
        },
        {
          'name': 'cpi',
          'displayName': 'CPI',
          'root': 'Product',
          'validation': 'length=3'
        }, {
          'name': 'vendor_desc',
          'displayName': 'Vendor Description',
          'root': 'Product'
        }, {
          'name': 'vendor_abbr',
          'displayName': 'Vendor Abbreviation',
          'root': 'Product'
        }, {
          'name': 'vendor_sku',
          'displayName': 'Vendor SKU',
          'root': 'Product'
        }, {
          'name': 'color',
          'displayName': 'Vendor Color',
          'root': 'Product'
        }, {
          'name': 'gender',
          'displayName': 'Vendor Gender',
          'suggestedValues': 'GENDER',
          'suggestedDataPoint': 'data',
          'reloadOnCreate': true,
          'restrictedSuggestedValues': true,
          'multi': true,
          'root': 'Product'
        }, {
          'name': 'upc',
          'displayName': 'UPC',
          'child': 'Size',
          'extend': {
            'match': 'id',
            'to': 'product_id',
            'core': 'product',
            'columns': ['cpi']
          }
        }

      ];

      $timeout(function () {

        console.log($scope.sFilters);

      }, 2500);

      $scope.sConfig = {

        'delay': 1000,

        'store': true,

        'placeholders': [
          'Enter your query here...',
          'Products will be searched via this query',
          'You can enter any search term you\'d like'
        ],

        'updateOnlyByEnterKey': true,

        'placeholderInterval': 1500,

        'autoCompleteUrl': 'http://10.61.71.33:7010/search/suggestions?q={"query":"{{query}}"}&use=autocomplete',

        'GENDER': 'http://demo0993385.mockable.io/gender'

      };

  }]);

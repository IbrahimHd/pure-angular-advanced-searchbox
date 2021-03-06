'use strict';

angular.module('paasb', [

  'paasb.config'

]);

'use strict';

angular.module('paasb.config', [])

.constant('FILTERS', {SELECTORS:[{name:'Contains',key:'contains',selected:true,notAllowed:['restrictedSuggestedValues']},{name:'Does not contain',key:'doesNotContain',notAllowed:['restrictedSuggestedValues']},{name:'Is Equal To',key:'isEqualTo'},{name:'Is Not Equal To',key:'isNotEqualTo'},{name:'Starts with',key:'startsWith'},{name:'Ends with',key:'endsWith'},{name:'Similiarity',key:'similiarity'}],OPERATORS:[{name:'AND',selected:true},{name:'OR'}]})

;
'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbAutoSize
 * @description
 * # Implementation of paasbAutoSize
 */

angular.module('paasb')

    .directive('paasbAutoSize', [
      '$parse',
      '$window',
      '$timeout',
      'paasbUtils',
      function ($parse, $window, $timeout, paasbUtils) {

        return {

            'restrict': 'A',

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var filter = null,

                autoSizeElement = $parse($attrs.paasbAutoSizeElement)($scope),

                autoSizeBoundingBox = $parse($attrs.paasbAutoSizeBoundingBox)($scope);

              $scope.reAutoSize = function () {

                var filterSelectorsHeight = 0;

                if(autoSizeBoundingBox && autoSizeBoundingBox.length) {

                  autoSizeBoundingBox = autoSizeBoundingBox[0];

                }

                $timeout(function () {

                  var searchInput = filter.element.find('input')[0],

                    boundingElement = autoSizeBoundingBox || searchInput,

                    bounding = boundingElement.getBoundingClientRect(),

                    boundingParent = filter.element[0].getBoundingClientRect(),

                    left = bounding.left;

                  if(searchInput === boundingElement) {

                    var boundingElem = filter.element
                      .find('div')[2],

                        boundingElementLeft;

                    if(!boundingElem) {

                      boundingElem = filter.element
                        .find('ul')[0];

                    }

                    if(boundingElem) {

                      boundingElementLeft = boundingElem.getBoundingClientRect().left;

                      left -= boundingElementLeft;

                    }

                  }

                  if(autoSizeElement) {

                    var selectorElem = angular.element(autoSizeElement),

                      elem = $element[0];

                    if(!selectorElem[0].contains(elem)) {

                      filterSelectorsHeight = selectorElem.find('ul')[0]

                        .getBoundingClientRect().height + bounding.height;

                    }

                  }

                  var extraSpace = paasbUtils.getStyle(searchInput, 'border-left-width');

                  $element
                    .css('left', left + 'px')
                    .css('width', (bounding.width - extraSpace) + 'px')
                    .css('top', filterSelectorsHeight ? (filterSelectorsHeight + 'px') : 'auto');

                });

              };

              $attrs.$observe('paasbAutoSize', function () {

                filter = $parse($attrs.paasbAutoSize)($scope);

                angular
                  .element($element)
                    .ready(function () {

                      $scope.reAutoSize();

                });

              });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbDraggable
 * @description
 * # Implementation of paasbDraggable
 */

angular.module('paasb')

    .directive('paasbDraggable', [
      'paasbUtils',
      function (paasbUtils) {

        return {

            'restrict': 'A',

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              $element.on('dragstart dragend', function (ev) {

                switch(ev.type) {

                  case 'dragstart':

                    var elem = angular.element(this),

                      id = paasbUtils.uuid(),

                      data = {

                        'id': id,

                        'draggable': true,

                        'trash': true

                      };

                    if(!elem.attr('id')) {

                      elem.attr('id', id);

                    }

                    ev.dataTransfer.setData('text', JSON.stringify(data));

                  break;

                  case 'dragend':

                  if($scope.Search && $scope.Search.Filtering) {

                    var Filtering = $scope.Search.Filtering;

                    Filtering
                      .removeClassAllFilters('over-placement-1')
                      .removeClassAllFilters('over-placement-2')
                      .removeClassAllFilters('over-placement-3')
                      .removeClassAllFilters('dragged-item');

                  }

                  break;

                }

              });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxAddedFilter
 * @description
 * # Implementation of paasbSearchBoxAddedFilter
 */

angular.module('paasb')

    .directive('paasbSearchBoxAddedFilter', [
      '$timeout',
      '$document',
      'paasbUi',
      'paasbUtils',
      function ($timeout, $document, paasbUi, paasbUtils) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-added-filter.html',

            'require': '^paasbSearchBoxFiltering',

            'scope': {

              'filter': '=',

              'filtering': '=',

              'toValue': '=',

              'operators': '='

            },

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var Filtering = $scope.filtering,

                filter = $scope.filter,

                operators = $scope.operators,

                config = null,

                input,

                dragSourceElem = null,

                dragSourceCount = 0;

              filter.loading = false;

              $element.attr('id', paasbUtils.uuid());

              if(typeof filter.suggestedValues === 'string') {

                config = Filtering.getConfig();

                var deepValue = paasbUtils.getDeepValue(config, filter.suggestedValues);

                if(deepValue) {

                  filter.suggestedValues = deepValue;

                }

              }

              if($scope.toValue) {

                $scope.value = $scope.toValue;

                $scope.dontOpen = true;

              }

              if(paasbUtils.isURL(filter.suggestedValues) ||

                (paasbUtils.isURL(filter.source) && filter.reloadOnCreate)) {

                  paasbUi.safeApply($scope, function () {

                    var url = filter.source || filter.suggestedValues;

                    angular.extend(filter, {

                      'loading': true,

                      'suggestedValues': [],

                      'source': url

                    });

                  });

                  Filtering
                    .loadSource(filter)
                      .then(function (data) {

                        paasbUi.safeApply($scope, function () {

                          angular.extend(filter, {

                            'suggestedValues': data,

                            'loading': false,

                            'value': ''

                          });

                        });

                      });

              } else {

                filter.value = '';

              }

              paasbUi.extend($scope, {

                'Utils': paasbUtils,

                getDirection: function (placement) {

                  var dir = null;

                  if(typeof placement === 'undefined' || placement === null) {

                    return dir;

                  }

                  if(typeof placement === 'string') {

                    placement = parseInt(placement);

                  }

                  switch(placement) {

                    case 1:

                      dir = 'before';

                    break;

                    case 3:

                      dir = 'after';

                    break;

                  }

                  return dir;

                },

                'events': {

                  searchboxClick: function (ev) {

                    var isChild = $element[0].contains(ev.target);

                    var isSelf = $element[0] == ev.target;

                    var isInside = isChild || isSelf;

                    if(!isInside) {

                      $scope.closeFilter();

                    }

                  },

                  inputKeyEvents: function (ev) {

                    if(ev.keyCode === 13) {

                      $scope.closeFilter();

                    }

                  },

                  dragEvents: function (ev) {

                    switch(ev.type) {

                      case 'dragstart':

                        dragSourceElem = angular.element(this);

                        ev.dataTransfer.effectAllowed = 'copyMove';

                        if(!dragSourceElem.attr('id')) {

                          dragSourceElem.attr('id', paasbUtils.uuid());

                        }

                        ev.dataTransfer.setData('text', dragSourceElem.attr('id'));

                        dragSourceElem.addClass('dragged-item');

                      break;

                      case 'dragenter':

                        ev.preventDefault();

                        dragSourceCount ++;

                      break;

                      case 'dragleave':

                        dragSourceCount --;

                        if(dragSourceCount === 0) {

                          angular.element(this).removeClass('over');

                        }

                      break;

                      case 'dragover':

                        var bounding = this.getBoundingClientRect(),

                          w = (bounding.width / 3);

                        var placement = Math.abs(Math.ceil((ev.pageX - bounding.left) / w)) || 1;

                        Filtering
                          .removeClassAllFilters('over-placement-1')
                          .removeClassAllFilters('over-placement-2')
                          .removeClassAllFilters('over-placement-3');

                        angular
                          .element(this)
                          .addClass('over-placement-' + placement)
                          .attr('data-placement', placement);

                        if(ev.preventDefault) {

                          ev.preventDefault();

                        }

                        ev.dataTransfer.dropEffect = 'copyMove';

                        return false;

                      break;

                      case 'drop':

                        if(ev.stopPropagation) {

                          ev.stopPropagation();

                        }

                        var data = ev.dataTransfer.getData('text'),

                          isJSON = false;

                        if(paasbUtils.isJson(data)) {

                          data = JSON.parse(data);

                          isJSON = true;

                        }

                        if(data) {

                          var id = data;

                          if(isJSON) {

                            id = data.id;

                          }

                          var elem = document.getElementById(id);

                          if(isJSON && data.draggable) {

                            if(data.trash) {

                                Filtering.removeByElement(this);

                            }

                          } else {

                            if(elem !== this) {

                              var placement = parseInt(angular
                                .element(this)
                                .attr('data-placement') || null),

                                direction = $scope.getDirection(placement);

                              Filtering[placement === 2 ? 'swapFilter' : 'moveFilter'](elem, this, direction);

                            }

                          }

                        }

                        return false;

                      break;

                      case 'dragend':

                        Filtering
                          .removeClassAllFilters('over-placement-1')
                          .removeClassAllFilters('over-placement-2')
                          .removeClassAllFilters('over-placement-3')
                          .removeClassAllFilters('dragged-item');

                      break;

                    }

                  }

                },

                takeSuggestion: function (val) {

                  $scope.value = val;

                },

                closeFilter: function () {

                  var self = this;

                  paasbUi.safeApply($scope, function () {

                    filter.editing = false;

                    $scope.$broadcast('filter.isEditing', filter.editing);

                    $document.unbind('click', self.events.searchboxClick);

                    if(!filter.value) {

                      Filtering.remove(filter);

                    } else {

                      if(filter.suggestedValue) {

                        filter.value = filter.suggestedValue.value;

                      } else {

                        if(filter.restrictedSuggestedValues) {

                          Filtering.remove(filter);

                        }

                      }

                    }

                  });

                },

                openFilter: function () {

                  if(!$scope.dontOpen) {

                    var self = this;

                    if(!filter.editing) {

                      filter.editing = true;

                      $scope.$broadcast('filter.isEditing', filter.editing);

                      $timeout(function () {

                        $document.bind('click', self.events.searchboxClick);

                      }, 25);

                      $scope.setFocus();

                    }

                  }

                  $scope.dontOpen = false;

                },

                destroy: function () {

                  return Filtering.remove($scope.filter, null, false);

                },

                getElements: function () {

                  input = $element.find('input');

                  return $scope;

                },

                registerEvents: function (events) {

                  input.on('keyup', events.inputKeyEvents);

                  $element.on('dragstart dragenter dragover dragleave drop dragend', events.dragEvents);

                  return $scope;

                },

                setFocus: function () {

                  $timeout(function () {

                    if(input) {

                      input[0].focus();

                    }

                  }, 50);

                  return $scope;

                },

                addWatch: function () {

                  $scope.$watch('value', function (__new) {

                    filter.value = __new || '';

                    if(filter.value) {

                      Filtering.update();

                    }

                  });

                  return $scope;

                }

              });

              $scope
                .getElements()
                .registerEvents($scope.events)
                .addWatch()
                .openFilter();

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxAutoComplete
 * @description
 * # Implementation of paasbSearchBoxAutoComplete
 */

angular.module('paasb')

    .directive('paasbSearchBoxAutoComplete', [
      '$window',
      '$document',
      '$timeout',
      '$interpolate',
      'paasbUi',
      'paasbUtils',
      'paasbAutoComplete',
      'paasbMemory',
      function ($window, $document, $timeout, $interpolate, paasbUi, paasbUtils, paasbAutoComplete, paasbMemory) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-auto-complete.html',

            'require': '^paasbSearchBox',

            'scope': {

              'query': '=',

              'config': '=',

              'input': '='

            },

            controller: ['$scope', '$element', function ($scope, $element) {

              var config = $scope.config,

                initialQuery = paasbMemory.getAndSet('query');

              $scope.$watch('query', function (__new) {

                if($scope.tookSuggestion !== __new) {

                  $scope.tookSuggestion = null;

                  if(__new && (initialQuery !== __new)) {

                    paasbAutoComplete
                      .load($interpolate(config.autoCompleteUrl)({

                        'query': __new

                      }))
                        .then(function (data) {

                          paasbUi.extend($scope, {

                            'autoSuggestions': data,

                            'showSuggestions': (data && data.length) ? true : false

                          });

                          $scope.position();

                        });

                  }

                }

              });

              angular.extend($scope, {

                'Utils': paasbUtils,

                'tookSuggestion': null,

                'showSuggestions': false,

                autoCompleteClick: function (ev) {

                  var tgt = ev.target,

                    elem = $element[0];

                  if(!elem.contains(tgt)) {

                    paasbUi.extend($scope, {

                      'showSuggestions': false

                    });

                  }

                  $document.unbind('click', $scope.autoCompleteClick);

                },

                position: function () {

                  $timeout(function () {

                    var input = $scope.input[0],

                      inputPadding = paasbUtils.getStyle(input, 'padding-left'),

                      inputWidth = paasbUtils.getStyle(input, 'width') -

                        paasbUtils.getStyle(input, 'padding-right') -

                        inputPadding;

                    $element
                      .css('left', inputPadding + 'px')
                      .css('width', inputWidth + 'px');

                  });

                },

                takeAutoComplete: function (suggestion) {

                  paasbUi.extend($scope, {

                    'showSuggestions': false,

                    'tookSuggestion': suggestion

                  });

                  $scope.$emit('take.autoSuggestion', suggestion);

                  $document.unbind('click', $scope.autoCompleteClick);

                },

                registerEvents: function () {

                  angular
                    .element($window)
                    .on('resize', function () {

                      $scope.position();

                    });

                  $scope.$on('input.focused', function () {

                    if($scope.autoSuggestions && $scope.autoSuggestions.length) {

                      paasbUi.extend($scope, {

                        'showSuggestions': true

                      });

                    }

                  });

                  $scope.$watch('showSuggestions', function (__new) {

                    if(__new) {

                      $document.bind('mousedown', $scope.autoCompleteClick);

                    }

                  });

                  return $scope;

                }

              });

              $scope
                .registerEvents();

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxCacheFilter
 * @description
 * # Implementation of paasbSearchBoxCacheFilter
 */

angular.module('paasb')

    .directive('paasbSearchBoxCacheFilter', [
      'paasbMemory',
      'paasbUi',
      function (paasbMemory, paasbUi) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-cache-filters.html',

            'require': '^paasbSearchBox',

            controller: ['$scope', function ($scope) {

              paasbUi.extend($scope, {

                'cacheActive': paasbMemory.getAndSet('cache') || false,

                handleCache: function () {

                  if(!$scope.paasbSearchBoxCacheFilterPermanent) {

                    $scope.cacheActive = !$scope.cacheActive;

                    paasbMemory.getAndSet('cache', $scope.cacheActive);

                  }

                }

              });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxFilterMovedAnimation
 * @description
 * # Implementation of paasbSearchBoxFilterMovedAnimation
 */

angular.module('paasb')

    .directive('paasbSearchBoxFilterMovedAnimation', [
      'paasbUtils',
      'paasbUi',
      function (paasbUtils, paasbUi) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-filter-moved-animation.html',

            'require': '^paasbSearchBoxAddedFilter',

            'scope': {

              'filter': '='

            },

            controller: ['$scope', '$element', function ($scope, $element) {

              var filter = $scope.filter,

                contents = $element.parent(),

                elem = null,

                boundingBox = null,

                height = 0,

                width = 0,

                radius = 0;

              if(filter) {

                elem = filter.element;

                boundingBox = contents[0].getBoundingClientRect();

                radius = paasbUtils.getStyle(contents[0], 'border-radius') || 0;

                height = (boundingBox.bottom - boundingBox.top);

                width = (boundingBox.width);

                var hWidth = (width / 2) + 6;

                var hHeight = (height / 2) + 6;

                $element
                  .css('border-left-width', hWidth + 'px')
                  .css('border-right-width', hWidth + 'px')
                  .css('border-top-width', hHeight + 'px')
                  .css('border-bottom-width', hHeight + 'px')
                  .css('border-radius', radius + 'px');

                paasbUi.apply(function () {

                  $element
                    .addClass('transition')
                    .css('border-left-width', '0px')
                    .css('border-right-width', '0px')
                    .css('border-top-width', '0px')
                    .css('border-bottom-width', '0px')
                    .css('border-radius', radius + 'px')
                    .css('width', width + 'px')
                    .css('height', height + 'px');

                }, 50);

              }

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxFilterMoved
 * @description
 * # Implementation of paasbSearchBoxFilterMoved
 */

angular.module('paasb')

    .directive('paasbSearchBoxFilterMoved', [
      '$parse',
      '$compile',
      function ($parse, $compile) {

        return {

            'restrict': 'A',

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var filter = null;

              $scope.hasRecentlyMoved = function () {

                if(filter && filter.recentlyMoved) {

                  var scope = $scope.$new(true),

                    compiledTemplate = null;

                  angular.extend(scope, {

                    'filter': filter

                  });

                  compiledTemplate = $compile('<paasb-search-box-filter-moved-animation filter="filter" />')(scope);

                  $element.prepend(compiledTemplate);

                }

                delete filter.recentlyMoved;

              };

              $attrs.$observe('paasbSearchBoxFilterMoved', function () {

                filter = $parse($attrs.paasbSearchBoxFilterMoved)($scope);

                angular
                  .element($element)
                    .ready(function () {

                      $scope.hasRecentlyMoved();

                });

              });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxFilterOperators
 * @description
 * # Implementation of paasbSearchBoxFilterOperators
 */

angular.module('paasb')

    .directive('paasbSearchBoxFilterOperators', [
      '$document',
      'paasbUi',
      'FILTERS',
      function ($document, paasbUi, FILTERS) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-filter-operators.html',

            'require': '^paasbSearchBoxAddedFilter',

            'scope': {

              'filtering': '=',

              'filter': '='

            },

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var Filtering = $scope.filtering,

                operators = angular.copy(FILTERS.OPERATORS),

                filter = $scope.filter;

              if(Filtering.getFilterCount() > 1) {

                $scope.hasOperator = true;

                $scope.autoSizeElement = $element;

                angular.extend($scope, {

                  'availableOperators': operators,

                  'showOperators': false,

                  'events': {

                    docClick: function (ev) {

                      var isChild = $element[0].contains(ev.target);

                      var isSelf = $element[0] == ev.target;

                      var isInside = isChild || isSelf;

                      if(!isInside) {

                        $document.unbind('click', $scope.events.docClick);

                        paasbUi.extend($scope, {

                          'showOperators': false

                        });

                      }

                    }

                  },

                  openOperators: function () {

                    $scope.showOperators = !$scope.showOperators;

                    $document[$scope.showOperators ? 'bind': 'unbind']('click', $scope.events.docClick);

                    $scope.reAutoSize();

                  },

                  takeOperator: function (operator) {

                    angular.forEach(operators, function (availableOperator) {

                      availableOperator.selected = false;

                    });

                    $scope.operator = operator;

                    Filtering.addOperatorToFilter(operator, filter);

                    operator.selected = true;

                  },

                  takeOperatorByName: function (operatorName) {

                    angular.forEach(operators, function (availableOperator) {

                      if(availableOperator.name !== operatorName) {

                        availableOperator.selected = false;

                      } else {

                        availableOperator.selected = true;

                        $scope.operator = availableOperator;

                      }

                    });

                  },

                  setDefaultOperator: function () {

                    var operatorByFilter = Filtering.getOperatorByFilterIndex(filter);

                    if(operatorByFilter === null) {

                      if(!filter.operator) {

                        angular.forEach(operators, function (availableOperator) {

                          if(availableOperator.selected) {

                            $scope.operator = availableOperator;

                          }

                        });

                        if(!filter.selector && operators &&

                          operators.length) {

                            var operator = operators[0];

                            operator.selected = true;

                            $scope.operator = operator;

                        }

                      } else {

                        angular.forEach(operators, function (availableOperator) {

                          availableOperator.selected = (availableOperator.key === filter.selector.key);

                        });

                      }

                    } else {

                      this.takeOperatorByName(operatorByFilter);

                    }

                    return $scope;

                  },

                  registerOperator: function () {

                    Filtering.registerOperator($scope);

                    return $scope;

                  },

                  addOperatorToFilter: function () {

                    if(!Filtering.hasOperatorAlready(filter)) {

                      Filtering.addOperatorToFilter($scope.operator, filter, true);

                    }

                    return $scope;

                  }

                });

                $scope
                  .setDefaultOperator()
                  .registerOperator()
                  .addOperatorToFilter();

              }

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxFilterSelectors
 * @description
 * # Implementation of paasbSearchBoxFilterSelectors
 */

angular.module('paasb')

    .directive('paasbSearchBoxFilterSelectors', [
      'FILTERS',
      function (FILTERS) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-filter-selectors.html',

            'require': '^paasbSearchBoxAddedFilter',

            'scope': {

              'filtering': '=',

              'filter': '='

            },

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var Filtering = $scope.filtering,

                copy = angular.copy(FILTERS.SELECTORS),

                filter = $scope.filter;

              $scope.autoSizeElement = $element;

              angular.extend($scope, {

                'availableSelectors': null,

                'filter': angular.extend(filter, {

                  'hasFilterSelectors': $element

                }),

                takeSelector: function (selector) {

                  angular.forEach($scope.availableSelectors,

                    function (availableSelector) {

                      availableSelector.selected = false;

                  });

                  filter.selector = selector;

                  selector.selected = true;

                  if(filter.value) {

                    Filtering.update();

                  }

                  $scope.reAutoSize();

                  var input = filter.element.find('input')[0];

                  input.focus();

                },

                setDefaultSelector: function () {

                  if(!filter.selector) {

                    angular.forEach($scope.availableSelectors, function (availableSelector) {

                      if(availableSelector.selected) {

                        filter.selector = availableSelector;

                      }

                    });

                    if(!filter.selector && $scope.availableSelectors &&

                      $scope.availableSelectors.length) {

                        var selector = $scope.availableSelectors[0];

                        selector.selected = true;

                        filter.selector = selector;

                    }

                  } else {

                    angular.forEach($scope.availableSelectors, function (availableSelector) {

                      availableSelector.selected = (availableSelector.key === filter.selector.key);

                    });

                  }

                  return $scope;

                },

                setAvailableSelectors: function () {

                  var availableSelectors = [];

                  angular.forEach(copy, function (selector) {

                    var allowed = true;

                    angular.forEach(selector.notAllowed, function (notAllowed) {

                      if(filter[notAllowed]) {

                        allowed = false;

                      }

                    });

                    if(allowed) {

                      availableSelectors.push(selector);

                    }

                  });

                  $scope.availableSelectors = availableSelectors;

                  return $scope;

                }

              });

              $scope.$on('filter.isEditing', function (ev, editing) {

                if(editing) {

                  $scope.reAutoSize();

                }

              });

              $scope
                .setAvailableSelectors()
                .setDefaultSelector();

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxFiltering
 * @description
 * # Implementation of paasbSearchBoxFiltering
 */

angular.module('paasb')

    .directive('paasbSearchBoxFiltering', [
      '$document',
      '$timeout',
      '$window',
      'paasbUtils',
      'paasbUi',
      function ($document, $timeout, $window, paasbUtils, paasbUi) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-filtering.html',

            'require': '^paasbSearchBox',

            'scope': {

              'filters': '=',

              'search': '='

            },

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var Search = null;

              $scope.$watch('active', function (__new, __old) {

                if(__new && !$scope.windowClickedFn) {

                  $timeout(function () {

                    $scope.windowClickedFn = $document.on('click', $scope.windowClicked);

                  }, 25);

                } else {

                  if($scope.windowClickedFn) {

                    $document.off('click', $scope.windowClicked);

                    $scope.windowClickedFn = null;

                  }

                }

              });

              angular.extend($scope, {

                'active': false,

                'Utils': paasbUtils,

                windowClicked: function (ev) {

                  var target = ev.target,

                    elem = $element[0];

                  if(!elem.contains(target)) {

                    paasbUi.extend($scope, {

                      'active': false

                    });

                  }

                },

                position: function () {

                  if($scope.active) {

                    $timeout(function () {

                      var el = $element.parent(),

                        list = $element.find('ul'),

                        listBoundingBox = list[0].getBoundingClientRect(),

                        elBoundingBox = el[0].getBoundingClientRect();

                      list
                        .css('top', (elBoundingBox.height - 5) + 'px')
                        .css('width', (elBoundingBox.width + paasbUtils.getStyle(el[0], 'padding-right') +

                          paasbUtils.getStyle(el[0], 'padding-left') -

                          paasbUtils.getScrollbarWidth() / 2) + 'px');

                    }, 25);

                  }

                },

                toggleFilters: function () {

                  paasbUi.extend($scope, {

                    'active': !$scope.active

                  });

                  this.position();

                },

                addFilterAndClose: function (filter) {

                  Search.Filtering.add(filter);

                  paasbUi.extend($scope, {

                    'active': !$scope.active

                  });

                },

                registerEvents: function () {

                  angular
                    .element($window)
                    .on('resize', function () {

                      $scope.position();

                    });

                },

                addFilter: function (ev) {

                  var self = this,

                    target = paasbUtils.getParentByAttribute(ev.target, 'li', 'data-filter-name'),

                    filterName = target.attr('data-filter-name');

                  angular.forEach($scope.filters, function (filter) {

                    if(filter.name === filterName) {

                      if(filter.restrictedSuggestedValues) {

                        self.addFilterAndClose(filter);

                      } else {

                        if(!filter.multi) {

                          filter.notFiltered = !filter.notFiltered;

                          if(!filter.notFiltered) {

                            self.addFilterAndClose(filter);

                          }

                        } else {

                          self.addFilterAndClose(filter);

                        }

                      }

                    }

                  });

                }

              });

              $scope.$watch('search', function (__new, __old) {

                if((__new !== __old) && angular.isObject(__new)) {

                  Search = __new;

                  $scope.filters = angular.copy($scope.filters);

                  $scope.filters
      							.slice()
      							.reverse()
      							.forEach(function (filter, filterIndex, filterObject) {

                      filter.notFiltered = true;

                      if(filter.root) {

                        filter.filteredFrom = '<i class="fa fa-level-up"></i> (Derived from ' +

                          'Root <i class="fa fa-angle-double-right"></i> ' + filter.root + ')';

                      }

                      if(filter.child) {

                        filter.filteredFrom = '<i class="fa fa-level-down"></i> (Derived from ' + filter.child + ')';

                      }

                      if(filter.dontFilter) {

                        $scope.filters.splice(filterObject.length - 1 - filterIndex, 1);

                      }

                    });

                  $scope
                    .registerEvents();

                }

              });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBoxGrouping
 * @description
 * # Implementation of paasbSearchBoxGrouping
 */

angular.module('paasb')

    .directive('paasbSearchBoxGrouping', [
      function () {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox-grouping.html',

            'require': '^paasbSearchBox',

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var Grouper = null;

              if($scope.Search && $scope.Search.Grouper) {

                Grouper = $scope.Search.Grouper;

                angular.extend($scope, {

                  toggleGrouping: function () {

                    return Grouper.toggle();

                  }

                });

              }

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc directive
 * @name paasb.directive:paasbSearchBox
 * @description
 * # Implementation of paasbSearchBox
 */

angular.module('paasb')

    .directive('paasbSearchBox', [
      '$timeout',
      '$window',
      'paasbApi',
      'paasbUi',
      'paasbFiltering',
      'paasbGrouping',
      'paasbPlaceholders',
      'paasbMemory',
      'paasbUtils',
      'FILTERS',
      function ($timeout, $window, paasbApi, paasbUi, paasbFiltering, paasbGrouping, paasbPlaceholders, paasbMemory, paasbUtils, FILTERS) {

        return {

            'restrict': 'E',

            'replace': true,

            'templateUrl': 'views/directives/searchbox.html',

            'scope': {

              'searchParams': '=?',

              'paasbSearchBoxFiltering': '=?',

              'paasbSearchBoxConfig': '=?',

              'paasbSearchBoxAutoComplete': '=?',

              'paasbSearchBoxCacheFilter': '=?',

              'paasbSearchBoxEnableFilteringOperators': '=?',

              'paasbSearchBoxFilterSelectors': '=?',

              'paasbSearchBoxFilterOperators': '=?',

              'paasbSearchBoxEnableGrouping': '=?',

              'placeholder': '@'

            },

            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

              var params = null,

                config = null,

                autoComplete = null,

                Filterer = null,

                Grouper = null,

                Placeholding = null,

                timer = null,

                searchBox = {

                  'searchInputId': ('searchInput-' + paasbUtils.uuid()),

                  hasAutoCompleteConfigurations: function () {

                    return config && config.autoCompleteUrl;

                  },

                  make: function (name, extend, method, related) {

                    var val = $scope[name];

                    if(angular[method]) {

                      if(!angular[method](val)) {

                        if(method === 'isObject') {

                          val = angular.extend({}, extend);

                        } else {

                          val = extend;

                        }

                      } else {

                        if(extend && _.isEmpty(val)) {

                          $scope[name] = extend;

                          $scope[related] = extend[related];

                        }

                      }

                    } else {

                      if(this[method]) {

                        val = this[method](val);

                      }

                    }

                    return this;

                  },

                  'events': {

                    handleEraser: function () {

                      $scope.query = '';

                    },

                    handleGarbage: function () {

                      if((params.query && params.query.length) || $scope.hasFilters) {

                        Filterer.removeAll(true, true, {

                          'deleteOperators': true

                        });

                        $scope.query = '';

                      }

                    }

                  },

                  shouldStore: function () {

                    return (paasbMemory.getAndSet('cache') ||

                      $scope.paasbSearchBoxConfig.store) ? true : false;

                  },

                  configure: function () {

                    var defaultParams = {

                      'query': '',

                      'filters': {}

                    };

                    if($scope.paasbSearchBoxEnableFilteringOperators) {

                      angular.extend(defaultParams, {

                        'operators': []

                      });

                    }

                    if(FILTERS && FILTERS.SELECTORS && $scope.paasbSearchBoxFilterSelectors) {

                      FILTERS.SELECTORS = $scope.paasbSearchBoxFilterSelectors;

                    }

                    if(FILTERS && FILTERS.OPERATORS && $scope.paasbSearchBoxFilterOperators) {

                      FILTERS.OPERATORS = $scope.paasbSearchBoxFilterOperators;

                    }

                    this
                      .make('searchParams', this.shouldStore() ? paasbMemory.getAll() :

                        defaultParams, 'isObject', 'query')

                      .make('paasbSearchBoxFiltering', [], 'isArray')
                      .make('paasbSearchBoxConfig', {}, 'isObject')
                      .make('paasbSearchBoxAutoComplete', {}, 'isObject');

                    if($scope.query) {

                      $scope.hasQuery = true;

                    }

                    if(!this.shouldStore()) {

                      paasbMemory.removeAll();

                    }

                    if($scope.paasbSearchBoxConfig

                      && $scope.paasbSearchBoxConfig.store) {

                        $scope.paasbSearchBoxCacheFilter = true;

                    }

                    params = $scope.searchParams;

                    config = $scope.paasbSearchBoxConfig;

                    autoComplete = $scope.paasbSearchBoxAutoComplete;

                    $scope.autoCompleteEnabled = this.hasAutoCompleteConfigurations();

                    paasbUi.extend($scope, {

                      'searchInputId': this.searchInputId

                    });

                    return this;

                  },

                  send: function (params) {

                    angular.extend(params, {

                      '$$lastChange': new Date().getTime()

                    });

                    $scope.$emit('onChange', params);

                    return this;

                  },

                  addEvents: function () {

                    var self = this;

                    angular.extend($scope, this.events);

                    Filterer.watch(function (filters, operators, refresh) {

                      if($scope.paasbSearchBoxEnableFilteringOperators) {

                        paasbMemory.getAndSet('operators', operators);

                      }

                      if(timer) {

                        $timeout.cancel(timer);

                      }

                      if(config.delay && !refresh) {

                        params.filters = filters;

                        if($scope.paasbSearchBoxEnableFilteringOperators) {

                          params.operators = operators;

                        }

                        timer = $timeout(function () {

                          self.send(params);

                        }, config.delay);

                      } else {

                        params.filters = filters;

                        if($scope.paasbSearchBoxEnableFilteringOperators) {

                          params.operators = operators;

                        }

                        self.send(params);

                      }

                    });

                    $scope.$on('take.autoSuggestion', function (ev, data) {

                      $scope.skipDelay = true;

                      $scope.query = data;

                    });

                    $scope.$watch('query', function (__new) {

                      if(typeof __new !== 'undefined') {

                        if(paasbMemory.getAndSet('query') !== __new) {

                          paasbMemory.getAndSet('query', __new);

                          paasbUi.extend($scope, {

                            'hasQuery': (__new && __new.length) ? true : false

                          });

                          if(config.delay && !$scope.skipDelay) {

                            if(timer) {

                              $timeout.cancel(timer);

                            }

                            timer = $timeout(function () {

                              params.query = __new;

                              self.send(params);

                            }, config.delay);

                          } else {

                            if(timer) {

                              $timeout.cancel(timer);

                            }

                            $scope.skipDelay = false;

                            params.query = __new;

                            self.send(params);

                          }

                        }

                      }

                    });

                    $scope.input.on('focus', function () {

                      $scope.$broadcast('input.focused');

                    });

                    return this;

                  },

                  register: function () {

                    Filterer = new paasbFiltering($scope, config);

                    Grouper = new paasbGrouping($scope, config);

                    Placeholding = new paasbPlaceholders($scope, config);

                    angular.extend($scope, {

                      'Search': {

                        'Grouper': Grouper,

                        'Filtering': Filterer,

                        'Placeholding': Placeholding

                      }

                    });

                    Filterer
                      .addMemoryOperators()
                      .addByMemory(params);

                    Placeholding.setup();

                    $scope.$emit('onRegisterApi', this.getAPI());

                    return this;

                  },

                  getAPI: function () {

                    return(new paasbApi($scope, Filterer, Placeholding));

                  },

                  dom: function () {

                    var searchInput = angular.element(document.getElementById(this.searchInputId)),

                      searchBox = paasbUtils.getParentByAttribute(searchInput[0], 'div', 'data-search-box'),

                      searchWrapper = searchInput.parent();

                    paasbUi.extend($scope, {

                      'input': searchInput,

                      'wrapper': searchWrapper,

                      'box': searchBox

                    });

                    return this;

                  }

                };

              angular
                .element($element)
                .ready(function () {

                  searchBox
                    .configure()
                    .dom()
                    .register()
                    .addEvents()
                    .send(params);

                });

            }]

        };

    }]);

'use strict';

/**
 * @ngdoc filter
 * @name paasb.filter:paasbClean
 * @description
 * # paasbClean
 */

angular.module('paasb')

  .filter('paasbClean', [function () {

      return function (_data, middleware) {

        if(_data && !_data.$$timestamp) {

          _data.$$timestamp = new Date().getTime();

        }

        _data.$$modified = new Date().getTime();

        if(middleware) {

          if(typeof middleware === 'function') {

            _data.modifiedValue = middleware(_data.value);

          } else if (angular.isArray(middleware)) {

            var modifiedValue = _data.value;

            angular.forEach(middleware, function (m) {

              modifiedValue = m(modifiedValue);

            });

            _data.modifiedValue = modifiedValue;

          }

        }

        return _data;

      };

  }]);

'use strict';

/**
 * @ngdoc filter
 * @name paasb.filter:paasbSuggest
 * @description
 * # paasbSuggest filter
 */

angular.module('paasb')

  .filter('paasbSuggest', [function () {

    return _.memoize(function (suggestions, value, filter, suggested) {

      if(!value) {

        var modifiedSuggestions = [];

        angular.forEach(suggestions, function (suggestion) {

          modifiedSuggestions.push({

            'modified': suggestion,

            'value': suggestion

          });

        });

        return modifiedSuggestions;

      }

      var percentageSuggestions = [],

        showSuggestions = [],

        val = new String(value);

      angular.forEach(suggestions, function (suggestion) {

        var lSuggestion = suggestion.toLowerCase(),

          lVal = val.toLowerCase();

        if(lSuggestion.indexOf(lVal) !== -1) {

          var matches = [],

            looping = true,

            needle = -1;

          while(looping) {

            needle = lSuggestion.indexOf(lVal, ((matches.length) ? (needle + 1) : needle));

            if(needle !== -1) {

              var len = lVal.length;

              matches.push({

                'start': needle,

                'end': len,

                'len': len - 1

              });

            } else {

              looping = false;

            }

          };

          var modifiedSuggestion = suggestion,

            addedCharacters = 0;

          angular.forEach(matches, function (match) {

            var firstString = modifiedSuggestion.substr(0, match.start + addedCharacters),

              middleString = '<b>' + modifiedSuggestion.substr(match.start + addedCharacters, match.end) + '</b>',

              endString = modifiedSuggestion.substr(match.start + addedCharacters + 1 + match.len, modifiedSuggestion.length);

            modifiedSuggestion = firstString + middleString + endString;

            addedCharacters += 7;

          });

        }

        if(modifiedSuggestion) {

          showSuggestions.push({

            'modified': modifiedSuggestion,

            'value': suggestion

          });

        }

      });

      filter.suggestedValue = (showSuggestions && showSuggestions.length ? showSuggestions[0] : null);

      return showSuggestions;

    }, function (items, field) {

      return items.length + field;

    });

  }]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbApi
 * @description
 * # paasbApi Services
 */

angular.module('paasb')

	.factory('paasbApi', [
    '$q',
		'$http',
    'paasbUi',
    function ($q, $http, paasbUi) {

  		return (function (scope, filtering, placeholding) {

        return({

          'Filtering': filtering,

          'Placeholding': placeholding,

          'Loading': {

            set: function (val) {

              if(typeof val === 'boolean') {

                paasbUi.extend(scope, {

                  'isLoading': val

                });

              }

            }

          },

          destroy: function () {

            if(placeholding) {

              placeholding.stopAll();

            }

            scope.$destroy();

          }

        });

      });

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbAutoComplete
 * @description
 * # paasbAutoComplete Services
 */

angular.module('paasb')

	.factory('paasbAutoComplete', [
		'$q',
    '$http',
    function ($q, $http) {

			var paasbAutoComplete = {

        load: function (url) {

          var deferred = $q.defer();

          $http({
            'method': 'GET',
            'url': url
          })
            .then(function (response) {

              if(response && response.data) {

                deferred.resolve(response.data);

              }

            }, function () {

              deferred.resolve([]);

            });

          return deferred.promise;

        }

  		};

  		return paasbAutoComplete;

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbFiltering
 * @description
 * # paasbFiltering Services
 */

angular.module('paasb')

	.factory('paasbFiltering', [
		'$q',
		'$filter',
    '$compile',
		'$http',
		'paasbUi',
		'paasbUtils',
		'paasbMemory',
		'paasbValidation',
		'FILTERS',
    function ($q, $filter, $compile, $http, paasbUi, paasbUtils, paasbMemory, paasbValidation, FILTERS) {

      var scope = null,

				config = null;

  		return function (_scope, _config) {

        scope = _scope;

				config = _config;

        var Search = null;

        scope.$watch('Search', function (__new, __old) {

          if(angular.isObject(__new)) {

            Search = __new;

          }

        });

				angular.extend(scope, {

					'addedFilters': [],

					'addedOperators': [],

					'registeredOperators': [],

					'addedScopes': {}

				});

        angular.extend(this, {

					'clean': $filter('paasbClean'),

					removeByElement: function (elem) {

						var self = this;

						angular.forEach(scope.addedFilters, function (addedFilter) {

							if(addedFilter && (addedFilter.element[0] === elem)) {

								self.remove(addedFilter);

							}

						});

						return this;

					},

					removeClassAllFilters: function (cls) {

						angular.forEach(scope.addedFilters, function (addedFilter) {

							if(addedFilter && addedFilter.element) {

								var el = addedFilter.element;

								el.removeClass(cls);

							}

						});

						return this;

					},

					getFilterByElement: function (element) {

						var data = null;

						angular.forEach(scope.addedFilters, function (filter, index) {

							var filterElement = filter.element[0];

							if(filter && (filterElement === element)) {

								data = {

									'index': index,

									'filter': filter

								};

							}

						});

						return data;

					},

					moveFilter: function (source, dest, direction) {

						var sourceFilter = this.getFilterByElement(source),

							clonedFilters = angular.copy(scope.addedFilters),

							operators = this.getOperators();

						if(sourceFilter) {

							clonedFilters.splice(sourceFilter.index, 1);

							var destFilter = this.getFilterByElement(dest),

								index = null;

							switch(direction) {

								case 'before':

									index = destFilter.index;

								break;

								case 'after':

								index = (destFilter.index + 1);

								break;

							}

							sourceFilter.filter.recentlyMoved = true;

							if(index !== null) {

								if(index > clonedFilters.length) {

									clonedFilters.push(sourceFilter.filter);

								} else {

									clonedFilters.splice(index, 0, sourceFilter.filter);

								}

							}

							this.rearrangeOperators(sourceFilter, destFilter);

							this.removeAll(true, false, {

								'drag': true

							});

							this.addByMemory(clonedFilters, true);

						}

					},

					rearrangeOperators: function (source, dest) {

						var operators = this.getOperators();

						if(operators && operators.length) {

							var sFilterIndex = (source.index - 1),

								dFilterIndex = (dest.index - 1),

								sFilterOperator = scope.addedOperators[sFilterIndex],

								dFilterOperator = scope.addedOperators[dFilterIndex];

							if(sFilterIndex !== -1 && dFilterOperator) {

								scope.addedOperators[source.index - 1] = dFilterOperator;

							}

							if(dFilterIndex !== -1 && sFilterOperator) {

								scope.addedOperators[dest.index - 1] = sFilterOperator;

							}

						}

					},

					swapFilter: function (source, dest) {

						var sourceFilter = this.getFilterByElement(source),

							destFilter = this.getFilterByElement(dest);

						if(sourceFilter && destFilter) {

							var clonedFilters = angular.copy(scope.addedFilters),

								sFilter = sourceFilter.filter,

								dFilter = destFilter.filter,

								operators = this.getOperators();

							clonedFilters[sourceFilter.index] = dFilter;

							clonedFilters[destFilter.index] = sFilter;

							this.rearrangeOperators(sourceFilter, destFilter);

							sFilter.recentlyMoved = true;

							this.removeAll(true, false, {

								'drag': true

							});

							this.addByMemory(clonedFilters, true);

						}

					},

					getOperatorByFilterIndex: function (filter) {

						var index = null,

							oIndex = 0,

							op = null;

						angular.forEach(scope.addedFilters, function (addedFilter, addedIndex) {

							if(filter.uuid === addedFilter.uuid) {

								index = addedIndex;

							}

						});

						oIndex = (index - 1);

						if(Math.sign(oIndex) !== -1) {

							op = scope.addedOperators[oIndex];

							if(typeof op === 'undefined') {

								op = null;

							}

						}

						return op;

					},

					addOperatorToFilter: function (operator, filter, dontUpdate) {

						if(filter) {

							var index = null;

							angular.forEach(scope.addedFilters, function (addedFilter, addedIndex) {

								if(filter.uuid === addedFilter.uuid) {

									index = addedIndex;

								}

							});

							if(index !== null) {

								var filterIndex = (index - 1);

								if(!scope.addedOperators[filterIndex]) {

									scope.addedOperators.push(operator.name);

								} else {

									scope.addedOperators[filterIndex] = operator.name;

								}

							}

						} else {

							scope.addedOperators.push(operator.name);

						}

            if(!dontUpdate) {

              this.update();

            }

					},

					getOperatorsInMemory: function () {

						return paasbMemory.getAndSet('operators') || [];

					},

					getOperators: function () {

						return scope.addedOperators;

					},

					hasOperatorAlready: function (filter) {

						var ops = this.getOperators(),

							filters = this.getFilters(),

							hasOperator = false;

						angular.forEach(ops, function (op, opIndex) {

							angular.forEach(filters, function (_filter, _filterIndex) {

								if(_filter.uuid === filter.uuid) {

									if((_filterIndex - 1) === opIndex) {

										hasOperator = true;

									}

								}

							});

						});

						return hasOperator;

					},

					addMemoryOperators: function () {

						var ops = this.getOperatorsInMemory();

						if(ops && ops.length) {

							scope.addedOperators = ops;

						}

						return this;

					},

					getConfig: function () {

						return config;

					},

					getFilters: function () {

						return scope.addedFilters;

					},

					getFilterCount: function () {

						return scope.addedFilters.length;

					},

					watch: function (fn) {

						this.callback = fn;

					},

					update: function (forceRefresh) {

						if(this.callback) {

							var filters = this.buildParameters();

							paasbMemory.getAndSet('filters', filters);

							return this.callback(filters, scope.addedOperators || [], forceRefresh);

						}

					},

					buildParameters: function () {

						var params = [],

							self = this;

						angular.forEach(scope.addedFilters, function (filter) {

							var buildParam = function (filter) {

								var opts = {},

									filterOperator = self.getOperatorByFilterIndex(filter);

								if(filterOperator) {

									opts.$$operator = filterOperator;

								}

								var _params = angular.extend({

									'condition': filter.selector.key,

									'value': filter.value,

									'name': filter.name,

									'$$timestamp': filter.$$timestamp || null,

									'$$modified': filter.$$timestamp || null

								}, opts, filter.extend || {});

								params.push(self.clean(_params, filter.middleware));

							};

							if(paasbValidation.has(filter)) {

								if(paasbValidation.validate(filter)) {

									buildParam(filter);

								}

							} else {

								buildParam(filter);

							}

						});

						return params;

					},

					getFilterContainer: function () {

						if(!this.filterContainerId) {

							this.filterContainerId = paasbUtils.uuid();

							var div = document.createElement('div');

							div.id = this.filterContainerId;

							angular
								.element(div)
								.attr('ng-hide', '!addedFilters.length')
								.addClass('paasb-added-filters-wrapper paasb-clearfix');

							if(scope.paasbSearchBoxEnableGrouping) {

								angular
									.element(div)
									.prepend('<paasb-search-box-grouping />');

							}

							scope.wrapper
								.parent()
								.append(
									$compile(div)(scope)
								);

						}

						return angular.element(document.getElementById(this.filterContainerId));

					},

					hasFilterGrouping: function () {

						return scope.paasbSearchBoxEnableGrouping;

					},

					addByMemory: function (options, erased) {

						var opts = options.filters || options,

							self = this;

						angular.forEach(opts, function (option) {

							if(erased) {

								paasbUtils.removeObjectProperties(option, [
									'$filter',
									'editing',
									'element',
									'filteredFrom',
									'hasFilterSelectors',
									'loading',
									'notFiltered',
									'selector',
									'uuid'
								]);

							}

							angular.forEach(scope.paasbSearchBoxFiltering, function (filter) {

								if(option.name === filter.name) {

									self.add(filter, option);

								}

							});

						});

						return this;

					},

					registerOperator: function (op) {

						scope.registeredOperators.push(op);

					},

					addProperty: function (filter, opts, key) {

						if(opts && opts[key]) {

							filter[key] = opts[key];

						}

						return this;

					},

          add: function (filter, options) {

            var childScope = scope.$new(true),

							clonedFilter = angular.copy(filter),

							operators = scope.paasbSearchBoxEnableFilteringOperators;

						this
							.addProperty(clonedFilter, options, '$$timestamp')
							.addProperty(clonedFilter, options, '$$modified')

						angular.extend(childScope, {

              'filter': clonedFilter,

							'filtering': this,

							'operators': operators,

							'toValue': (options && options.value) ?

								options.value : null

            });

						var compiledElement = $compile('<paasb-search-box-added-filter ' +

							'filter="filter" filtering="filtering" ' +

							'operators="operators" to-value="toValue" />')(childScope);

            this
							.getFilterContainer()
							.append(compiledElement);

						angular.extend(clonedFilter, {

							'element': compiledElement,

							'$filter': filter,

							'uuid': paasbUtils.uuid()

						});

						if(options && options.condition) {

							angular.forEach(FILTERS.SELECTORS, function (selector) {

								if(selector.key === options.condition) {

									clonedFilter.selector = selector;

								}

							});

						}

						scope.addedScopes[clonedFilter.uuid] = childScope;

						paasbUi.safeApply(scope, function () {

							scope.hasFilters = true;

							scope.addedFilters.push(clonedFilter);

						});

          },

          remove: function (filter, dontUpdate, overrideUpdate, options) {

						var fIndex = null,

							self = this,

							operators = self.getOperators();

						scope.addedFilters
							.forEach(function (sAddedFilter, sAddedIndex) {

								if(sAddedFilter.uuid === filter.uuid) {

									fIndex = sAddedIndex;

								}

							});

						scope.addedFilters
							.slice()
							.reverse()
							.forEach(function (addedFilter, addedIndex, addedObject) {

								if(addedFilter.uuid === filter.uuid) {

									if(operators && operators.length) {

										var oIndex = (fIndex - 1);

										if(Math.sign(oIndex) === -1) {

											var ffIndex = (fIndex + 1),

												nextFilter = scope.addedFilters[ffIndex],

												nextScope = null;

											if(nextFilter) {

												nextScope = scope.addedScopes[nextFilter.uuid];

												paasbUi.extend(nextScope, {

													'operators': false

												});

											}

										} else {

											oIndex = 0;

										}

										scope.registeredOperators.splice(oIndex, 1);

										console.log(scope.addedOperators);

										if(!dontUpdate || (options && options.deleteOperators)) {

											scope.addedOperators.splice(oIndex, 1);

										}

										console.log(scope.addedOperators);

									}

									addedFilter.element.remove();

									var addedScope = scope.addedScopes[filter.uuid];

									if(addedScope) {

										addedScope.$destroy();

										delete scope.addedScopes[filter.uuid];

									}

									filter.$filter.notFiltered = true;

									scope.addedFilters.splice(addedObject.length - 1 - addedIndex, 1);

								}

							});

							if(scope.addedFilters && !scope.addedFilters.length) {

								scope.hasFilters = false;

							}

							if(!dontUpdate) {

								if(typeof overrideUpdate !== 'boolean') {

									overrideUpdate = true;

								}

								this.update(overrideUpdate);

							}

          },

          removeAll: function (dontUpdate, removeMemory, options) {

						var self = this;

						scope.addedFilters
							.slice()
							.reverse()
							.forEach(function (addedFilter) {

								var opts = {

									'deleteOperators': true

								};

								if(options && options.drag) {

									delete opts.deleteOperators;

								}

								return self.remove(addedFilter, dontUpdate, undefined, opts);

							});

						if(!dontUpdate || removeMemory) {

							paasbMemory.removeAll();

						}

						if(removeMemory) {

							this.update();

						}

          },

					loadSource: function (filter) {

						var deferred = $q.defer();

						$http
							.get(filter.source)
								.then(function (options) {

									if(filter.suggestedDataPoint) {

										return deferred.resolve(options && options.data[filter.suggestedDataPoint] ?

											options.data[filter.suggestedDataPoint] : null);

									}

									return deferred.resolve(options ? options.data : null);

						});

						return deferred.promise;

					}

        });

      };

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbGrouping
 * @description
 * # paasbGrouping Services
 */

angular.module('paasb')

	.factory('paasbGrouping', [
		'paasbUi',
    function (paasbUi) {

      var scope = null,

				config = null;

  		return function (_scope, _config) {

        scope = _scope;

				config = _config;

        var Search = null;

        scope.$watch('Search', function (__new, __old) {

          if(angular.isObject(__new)) {

            Search = __new;

          }

        });

				angular.extend(scope, {

					'isGroupingEnabled': false

				});

        angular.extend(this, {

					toggle: function () {

						paasbUi.extend(scope, {

							'isGroupingEnabled': !scope.isGroupingEnabled

						});

					}

        });

      };

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbMemory
 * @description
 * # paasbMemory Services
 */

angular.module('paasb')

	.factory('paasbMemory', [
		'$window',
    function ($window) {

      var storage = $window.localStorage,

        paasbMemory = {

          'hash': 'paasb',

          getAndSet: function (key, value) {

            if(!storage.getItem(this.hash)) {

              storage.setItem(this.hash, '{}');

            }

            var store = storage.getItem(this.hash);

            if(store) {

              store = JSON.parse(store);

              if(typeof value === 'undefined') {

                return store[key];

              } else {

                store[key] = value;

                storage.setItem(this.hash, JSON.stringify(store));

              }

            }

          },

          getAll: function () {

            var data = JSON.parse(storage.getItem(this.hash));

            if(data) {

              delete data.cache;

              return data;

            }

            return {};

          },

          removeAll: function () {

            var cache = this.getAndSet('cache'),

              obj = {};

            if(cache !== null) {

              obj.cache = cache;

            }

            storage.setItem(this.hash, JSON.stringify(obj));

          }

    		};

  		return paasbMemory;

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbPlaceholders
 * @description
 * # paasbPlaceholders Services
 */

 angular.module('paasb')

 	.factory('paasbPlaceholders', [
     '$timeout',
     function ($timeout) {

       var scope = null,

         config = null,

         timer;

       return function (_scope, _config) {

         scope = _scope;

         config = _config;

         angular.extend(this, {

           'index': 0,

           'position': 0,

           'val': '',

           stopAll: function () {

             $timeout.cancel(timer);

           },

           setup: function () {

             if(config && config.placeholders

               && config.placeholders.length) {

                 this.start(this.index);

             } else {

               if(scope.placeholder && typeof scope.placeholder === 'string') {

                 scope.input.attr('placeholder', scope.placeholder);

               }

             }

           },

           start: function (index) {

             if(typeof index !== 'undefined') {

               this.index = index;

             } else {

               if(typeof this.index !== 'undefined') {

                 this.index = 0;

               } else {

                 this.index ++;

               }

             }

             this.position = 0;

             this.val = '';

             this.change();

           },

           change: function (reverse) {

             var self = this;

             if(reverse) {

               timer = $timeout(function () {

                 self.val = self.val.slice(0, self.val.length - 1);

                 scope.input.attr('placeholder', self.val);

                 if(self.val.length) {

                   self.change(true);

                 } else {

                   self.position = 0;

                   self.index ++;

                   if(self.index > (config.placeholders.length - 1)) {

                     self.index = 0;

                   }

                   self.change();

                 }

               }, config.placeholderSpeedOutInterval || 25);

             } else {

               timer = $timeout(function () {

                 var val = config.placeholders[self.index],

                   len = val.length;

                 self.val += val[self.position];

                 scope.input.attr('placeholder', self.val);

                 self.position ++;

                 if(self.position < len) {

                   self.change();

                 } else {

                   timer = $timeout(function () {

                     self.change(true);

                   }, config.placeholderInterval || 2000);

                 }

               }, config.placeholderSpeedInInterval || 75);

             }

           }

         });

       };

 	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbUi
 * @description
 * # paasbUi Services
 */

angular.module('paasb')

	.factory('paasbUi', [
		'$timeout',
    function ($timeout) {

			var paasbUi = {

				extend: function (scope, opts) {

					this.safeApply(scope, function () {

						angular.extend(scope, opts);

					});

				},

				safeApply: function($scope, fn) {

					var phase = $scope.$root.$$phase;

					if(phase === '$apply' || phase === '$digest') {

						if(fn && (typeof(fn) === 'function')) {

							fn();

						}

					} else {

						$scope.$apply(fn);

					}

				},

				apply: function (fn, ms) {

					return $timeout(fn, ms || 0);

				}

  		};

  		return paasbUi;

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbUtils
 * @description
 * # paasbUtils Services
 */

angular.module('paasb')

	.factory('paasbUtils', [
    '$sce',
		'$window',
    function ($sce, $window) {

			var paasbUtils = {
				
				uuid: function () {

					var d = Date.now();

					return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {

						var r = (d + Math.round(Math.random() * 16)) % 16 | 0;

						d = Math.floor(d / 16);

						return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);

					});

				},

				isJson: function (str) {

					try {

						JSON.parse(str);

					} catch (e) {

						return false;

					}

					return true;

				},

				removeObjectProperties: function(obj, props) {

					for(var i = 0; i < props.length; i++) {

						if(obj.hasOwnProperty(props[i])) {

							delete obj[props[i]];

						}

					}

				},

				getScrollbarWidth: function () {

					var scrollDiv = document.createElement('div');

					scrollDiv.className = 'scrollbar-measure';

					document.body.appendChild(scrollDiv);

					var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

					document.body.removeChild(scrollDiv);

					return scrollbarWidth;

				},

	      getParentByAttribute: function (target, nodeName, attrName) {

	        var looping = true,

	          looped = 0,

	          el = null;

	        target = angular.element(target);

	        while(looping) {

	          if(target[0] === document) {

	            break;

	          }

	          var nName = target[0].nodeName.toLowerCase();

	          if(nName === nodeName.toLowerCase()) {

	            if(target.attr(attrName)) {

	              el = target;

	              looping = false;

	              break;

	            }

	          }

	          target = target.parent();

	        };

	        return el;

	      },

				getStyle: function (elem, style) {

					return parseInt($window.getComputedStyle(elem, null).getPropertyValue(style));

				},

        trust: function (html) {

          return $sce.trustAsHtml(html);

        },

        isURL: function (url) {

          var expression = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|' +

            '2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u' +

            '00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a' +

            '-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',

            regex = new RegExp(expression, 'i');

          return regex.test(url);

        },

				getDeepValue: function (root, path) {

					var segments = path.split('.'),

				      cursor = root,

				      target;

				  for (var i = 0; i < segments.length; ++i) {

						target = cursor[segments[i]];

						if (typeof target == "undefined") return void 0;

						cursor = target;

				  }

				  return cursor;

				}

  		};

  		return paasbUtils;

	}]);

'use strict';

/**
 * @ngdoc service
 * @name paasb.service:paasbValidation
 * @description
 * # paasbValidation Services
 */

angular.module('paasb')

	.factory('paasbValidation', [
		'$window',
    function ($window) {

      var paasbValidation = {

        length: function (value, len) {

          return (value.length === parseInt(len));

        },

				min: function (value, len) {

					return(value.length >= parseInt(len));

				},

				max: function (value, len) {

					return(value.length <= parseInt(len));

				},

				between: function (value, param) {

					var params = param.split(',');

					if(params && params.length === 2) {

						var min = this.min(value, params[0]),

							max = this.max(value, params[1]);

						return min && max;

					}

					return false;

				},

				numeric: function (value) {

					return !isNaN(value);

				},

				email: function (value) {

					var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

					return regex.test(value);

				},

				phone: function (value) {

					var regex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g;

					return regex.test(value);

				},

        has: function (filter) {

          return filter.validation ? true : false;

        },

        validate: function (filter) {

          var self = this,

            validation = [],

            passed = [];

          if(filter && filter.validation) {

            validation = filter.validation.split(' ');

            angular.forEach(validation, function (_validation) {

              var validator = _validation.split('='),

                name = validator[0],

                value = validator[1] || null;

							if(!self[name]) {

								passed.push({

									'name': name

								});

							} else {

								if(self[name](filter.value, value)) {

	                passed.push({

	                  'name': name,

	                  'value': value

	                });

	              }

							}

            });

            return (validation.length === passed.length);

          }

          return true;

        }

    	};

  		return paasbValidation;

	}]);

angular.module('paasb').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('views/directives/searchbox-added-filter.html',
    "\n" +
    "<div draggable=\"true\" class=\"paasb-searchbox-added-filter\">\n" +
    "  <paasb-search-box-filter-operators ng-if=\"operators\" filtering=\"filtering\" filter=\"filter\"></paasb-search-box-filter-operators>\n" +
    "  <div ng-click=\"openFilter();\" ng-class=\"{ 'child': filter.child, 'root': filter.root }\" paasb-search-box-filter-moved=\"filter\" class=\"paasb-searchbox-added-filter-contents\"><span ng-bind=\"filter.displayName + ':'\" class=\"filter-name\"></span><span ng-bind=\"filter.selector.name\" ng-if=\"filter.selector\" class=\"selector-type\"></span><span ng-bind=\"filter.value\" ng-hide=\"filter.editing\" class=\"filter-value\"></span>\n" +
    "    <input type=\"text\" ng-model=\"value\" ng-hide=\"!filter.editing\"/><span ng-hide=\"!filter.loading\">Loading...</span>\n" +
    "    <paasb-search-box-filter-selectors filtering=\"filtering\" filter=\"filter\"></paasb-search-box-filter-selectors>\n" +
    "    <div ng-if=\"filter.suggestedValues\">\n" +
    "      <ul ng-hide=\"!filter.editing\" paasb-auto-size=\"filter\" ng-if=\"!filter.loading\">\n" +
    "        <li ng-repeat=\"suggestion in filter.suggestedValues | suggest: filter.value:filter\" ng-click=\"takeSuggestion(suggestion.value)\"><span ng-bind-html=\"Utils.trust(suggestion.modified)\"></span></li>\n" +
    "      </ul>\n" +
    "    </div><i ng-click=\"destroy();\" class=\"fa fa-times\"></i>\n" +
    "  </div>\n" +
    "</div>"
  );


  $templateCache.put('views/directives/searchbox-auto-complete.html',
    "\n" +
    "<div ng-hide=\"!showSuggestions\" class=\"paasb-auto-complete-container\">\n" +
    "  <p>Most Popular Suggestions</p>\n" +
    "  <ul>\n" +
    "    <li ng-repeat=\"suggestion in autoSuggestions\" ng-click=\"takeAutoComplete(suggestion.plainTerm);\"><span ng-bind-html=\"Utils.trust(suggestion.term)\" class=\"suggestion-value\"></span><span ng-bind-html=\"Utils.trust(' - Suggested &lt;b&gt;' + suggestion.suggestedCount + '&lt;/b&gt; times')\" class=\"suggestion-count\"></span></li>\n" +
    "  </ul>\n" +
    "</div>"
  );


  $templateCache.put('views/directives/searchbox-cache-filters.html',
    "<i ng-class=\"{ 'active': cacheActive }\" ng-click=\"handleCache();\" class=\"paasb-search-box-cache-filter fa fa-archive\"></i>"
  );


  $templateCache.put('views/directives/searchbox-filter-moved-animation.html',
    "\n" +
    "<div class=\"paasb-searchbox-filter-moved-animation\"></div>"
  );


  $templateCache.put('views/directives/searchbox-filter-operators.html',
    "\n" +
    "<div ng-hide=\"!hasOperator\" ng-click=\"openOperators();\" class=\"paasb-searchbox-added-filter-operator\"><span><i class=\"fa fa-arrow-left\"></i><i ng-bind=\"operator.name\"></i><i class=\"fa fa-arrow-right\"></i></span>\n" +
    "  <div ng-hide=\"!showOperators\" class=\"paasb-searchbox-filter-operators\">\n" +
    "    <ul paasb-auto-size=\"filter\" paasb-auto-size-element=\"autoSizeElement\" paasb-auto-size-bounding-box=\"autoSizeElement\">\n" +
    "      <li ng-repeat=\"operator in availableOperators\" ng-class=\"{ 'active': operator.selected }\" ng-click=\"takeOperator(operator);\"><span ng-bind=\"operator.name\"></span></li>\n" +
    "    </ul>\n" +
    "  </div>\n" +
    "</div>"
  );


  $templateCache.put('views/directives/searchbox-filter-selectors.html',
    "\n" +
    "<div ng-class=\"{ 'loaded' : !filter.loading }\" ng-hide=\"!filter.editing\" class=\"paasb-searchbox-filter-selectors\">\n" +
    "  <ul paasb-auto-size=\"filter\" paasb-auto-size-element=\"autoSizeElement\">\n" +
    "    <li ng-repeat=\"selector in availableSelectors\" ng-class=\"{ 'active': selector.selected }\" ng-click=\"takeSelector(selector);\"><span ng-bind=\"selector.name\"></span></li>\n" +
    "  </ul>\n" +
    "</div>"
  );


  $templateCache.put('views/directives/searchbox-filtering.html',
    "\n" +
    "<div class=\"paasb-filtering paasb-clearfix\"><span ng-click=\"toggleFilters();\" ng-class=\"{ 'active': active }\"><i class=\"fa fa-filter\"></i></span>\n" +
    "  <ul ng-hide=\"!active\">\n" +
    "    <li ng-repeat=\"filter in filters\" data-filter-name=\"{{filter.name}}\" ng-class=\"{ 'child-filter': filter.child, 'root-filter': filter.root }\" ng-click=\"addFilter($event);\" ng-if=\"filter.notFiltered\"><i class=\"fa fa-filter\"></i><span ng-bind=\"filter.displayName\" class=\"filter-display-name\"></span><span ng-bind-html=\"Utils.trust(filter.filteredFrom)\" class=\"filtered-from\"></span></li>\n" +
    "  </ul>\n" +
    "</div>"
  );


  $templateCache.put('views/directives/searchbox-grouping.html',
    "\n" +
    "<div ng-class=\"{ 'grouping-active': isGroupingEnabled }\" ng-click=\"toggleGrouping();\" class=\"paasb-search-box-grouping\"><i class=\"fa fa-plus\"></i></div>"
  );


  $templateCache.put('views/directives/searchbox.html',
    "\n" +
    "<div data-search-box=\"true\" class=\"paasb-searchbox\">\n" +
    "  <paasb-search-box-filtering search=\"Search\" filters=\"paasbSearchBoxFiltering\" ng-if=\"paasbSearchBoxFiltering &amp;&amp; paasbSearchBoxFiltering.length\"></paasb-search-box-filtering>\n" +
    "  <div class=\"paasb-searchbox-wrapper\"><i ng-class=\"{ 'fa-search': !query.length, 'fa-trash': ((query &amp;&amp; query.length) || hasFilters) }\" ng-click=\"handleGarbage();\" paasb-draggable=\"\" draggable=\"true\" class=\"fa\"></i>\n" +
    "    <paasb-search-box-cache-filter ng-if=\"paasbSearchBoxCacheFilter\"></paasb-search-box-cache-filter><i ng-if=\"isLoading\" ng-class=\"{ 'no-cache-filtering': !paasbSearchBoxCacheFilter, 'has-eraser-and-no-cache-filtering': (hasQuery &amp;&amp; !paasbSearchBoxCacheFilter), 'has-eraser-and-cache-filtering': (hasQuery &amp;&amp; paasbSearchBoxCacheFilter) }\" class=\"fa fa-cog fa-spin\"></i>\n" +
    "    <input type=\"text\" ng-model=\"query\" id=\"{{searchInputId}}\"/><i ng-if=\"hasQuery\" ng-class=\"{ 'no-cache-filtering': !paasbSearchBoxCacheFilter }\" ng-click=\"handleEraser();\" class=\"fa fa-eraser\"></i>\n" +
    "    <paasb-search-box-auto-complete query=\"searchParams.query\" config=\"paasbSearchBoxAutoComplete\" input=\"input\" ng-if=\"autoCompleteEnabled\"></paasb-search-box-auto-complete>\n" +
    "  </div>\n" +
    "</div>"
  );

}]);

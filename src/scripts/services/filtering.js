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

							clonedFilters = _.cloneDeep(scope.addedFilters),

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

							if(index !== null) {

								if(index > clonedFilters.length) {

									clonedFilters.push(sourceFilter.filter);

								} else {

									clonedFilters.splice(index, 0, sourceFilter.filter);

								}

							}

							this.rearrangeOperators(sourceFilter, destFilter);

							sourceFilter.recentlyMoved = true;

							this.removeAll(true);

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

							var clonedFilters = _.cloneDeep(scope.addedFilters),

								sFilter = sourceFilter.filter,

								dFilter = destFilter.filter,

								operators = this.getOperators();

							clonedFilters[sourceFilter.index] = dFilter;

							clonedFilters[destFilter.index] = sFilter;

							this.rearrangeOperators(sourceFilter, destFilter);

							sFilter.recentlyMoved = true;

							this.removeAll(true);

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

							this.update(true);

						}

						paasbMemory.getAndSet('operators', scope.addedOperators);

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

							var filters = this.clean(this.buildParameters());

							paasbMemory.getAndSet('filters', filters);

							return this.callback(filters, scope.addedOperators || [], forceRefresh);

						}

					},

					buildParameters: function () {

						var params = [];

						angular.forEach(scope.addedFilters, function (filter) {

							var buildParam = function (filter) {

								params.push(angular.extend({

									'condition': filter.selector.key,

									'value': filter.value,

									'$$name': filter.name,

									'$$timestamp': filter.$$timestamp || null,

									'$$modified': filter.$$timestamp || null,

								}, filter.extend || {}));

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

							this.filterContainerId = _.uuid();

							var div = document.createElement('div');

							div.id = this.filterContainerId;

							angular
								.element(div)
								.attr('ng-hide', '!addedFilters.length')
								.addClass('paasb-added-filters-wrapper paasb-clearfix');

							scope.wrapper
								.parent()
								.append(
									$compile(div)(scope)
								);

						}

						return angular.element(document.getElementById(this.filterContainerId));

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

								if(option.$$name === filter.name || option.name === filter.name) {

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

							clonedFilter = _.cloneDeep(filter),

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

							'uuid': _.uuid()

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

          remove: function (filter, dontUpdate) {

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

										if(!dontUpdate) {

											scope.addedOperators.splice(oIndex, 1);

										}

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

								this.update(true);

							}

          },

          removeAll: function (dontErase) {

						var self = this;

						scope.addedFilters
							.slice()
							.reverse()
							.forEach(function (addedFilter) {

								return self.remove(addedFilter, dontErase);

							});

						if(!dontErase) {

							paasbMemory.removeAll();

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

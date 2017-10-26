(function () {
  'use strict';

  angular
    .module('torrents')
    .controller('TorrentsController', TorrentsController);

  TorrentsController.$inject = ['$scope', '$state', '$translate', '$timeout', 'Authentication', 'Notification', 'TorrentsService',
    'MeanTorrentConfig', 'DownloadService', '$window', 'ScrapeService', 'DebugConsoleService', 'TorrentGetInfoServices', 'ResourcesTagsServices'];

  function TorrentsController($scope, $state, $translate, $timeout, Authentication, Notification, TorrentsService, MeanTorrentConfig,
                              DownloadService, $window, ScrapeService, mtDebug, TorrentGetInfoServices, ResourcesTagsServices) {
    var vm = this;
    vm.DLS = DownloadService;
    vm.TGI = TorrentGetInfoServices;
    vm.user = Authentication.user;
    vm.RTS = ResourcesTagsServices;
    vm.announce = MeanTorrentConfig.meanTorrentConfig.announce;
    vm.scrapeConfig = MeanTorrentConfig.meanTorrentConfig.scrapeTorrentStatus;
    vm.resourcesTags = MeanTorrentConfig.meanTorrentConfig.resourcesTags;
    vm.torrentSalesType = MeanTorrentConfig.meanTorrentConfig.torrentSalesType;
    vm.itemsPerPageConfig = MeanTorrentConfig.meanTorrentConfig.itemsPerPage;

    vm.searchTags = [];
    vm.searchKey = '';
    vm.releaseYear = undefined;
    vm.filterHnR = false;
    vm.topItems = 6;

    vm.torrentType = $state.current.data.torrentType;

    /**
     * commentBuildPager
     * pagination init
     */
    vm.torrentBuildPager = function () {
      vm.torrentPagedItems = [];
      vm.torrentItemsPerPage = vm.itemsPerPageConfig.torrentsPerPage;
      vm.torrentCurrentPage = 1;
      vm.torrentFigureOutItemsToDisplay();
    };

    /**
     * torrentFigureOutItemsToDisplay
     * @param callback
     */
    vm.torrentFigureOutItemsToDisplay = function (callback) {
      vm.getResourcePageInfo(vm.torrentCurrentPage, function (items) {
        vm.torrentFilterLength = items.total - vm.topItems;
        vm.torrentPagedItems = items.rows;

        if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInList) {
          ScrapeService.scrapeTorrent(vm.torrentPagedItems);
        }

        if (callback) callback();
      });
    };

    /**
     * torrentPageChanged
     */
    vm.torrentPageChanged = function () {
      var element = angular.element('#top_of_torrent_list');

      $('.tb-v-middle').fadeTo(100, 0.01, function () {
        vm.torrentFigureOutItemsToDisplay(function () {
          $timeout(function () {
            $('.tb-v-middle').fadeTo(400, 1, function () {
              //window.scrollTo(0, element[0].offsetTop - 60);
              $('html,body').animate({scrollTop: element[0].offsetTop - 60}, 200);
            });
          }, 100);
        });
      });
    };

    /**
     * getResourceTopInfo
     */
    vm.getResourceTopInfo = function () {
      TorrentsService.get({
        limit: vm.topItems,
        torrent_status: 'reviewed',
        torrent_type: vm.torrentType
      }, function (items) {
        mtDebug.info(items);
        vm.listTopInfo = items.rows;

        if (!vm.announce.privateTorrentCmsMode && vm.scrapeConfig.onTorrentInList) {
          ScrapeService.scrapeTorrent(vm.listTopInfo);
        }
      }, function (err) {
        Notification.error({
          message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('TOP_LIST_INFO_ERROR')
        });
      });
    };

    /**
     * onRadioTagClicked
     * @param event
     * @param n: tag name
     */
    vm.onRadioTagClicked = function (event, n) {
      var e = angular.element(event.currentTarget);

      if (e.hasClass('btn-success')) {
        e.removeClass('btn-success').addClass('btn-default');
        vm.searchTags.splice(vm.searchTags.indexOf(n), 1);
      } else {
        e.addClass('btn-success').removeClass('btn-default').siblings().removeClass('btn-success').addClass('btn-default');
        vm.searchTags.push(n);

        angular.forEach(e.siblings(), function (se) {
          if (vm.searchTags.indexOf(se.value) !== -1) {
            vm.searchTags.splice(vm.searchTags.indexOf(se.value), 1);
          }
        });
      }
      e.blur();
      vm.torrentBuildPager();
    };

    /**
     * onCheckboxTagClicked
     * @param event
     * @param n: tag name
     */
    vm.onCheckboxTagClicked = function (event, n) {
      var e = angular.element(event.currentTarget);

      if (e.hasClass('btn-success')) {
        vm.searchTags.push(n);
      } else {
        vm.searchTags.splice(vm.searchTags.indexOf(n), 1);
      }
      vm.torrentBuildPager();
    };

    /**
     * onKeysKeyDown
     * @param evt
     */
    vm.onKeysKeyDown = function (evt) {
      if (evt.keyCode === 13) {
        vm.torrentBuildPager();
      }
    };

    /**
     * orderByVote
     */
    vm.orderByVote = function () {
      if (vm.sortVote === undefined) {
        vm.sortVote = '-';
        vm.sort = '-resource_detail_info.vote_average';
      } else if (vm.sortVote === '-') {
        vm.sortVote = '+';
        vm.sort = 'resource_detail_info.vote_average';
      } else if (vm.sortVote === '+') {
        vm.sortVote = undefined;
        vm.sort = undefined;
      }

      vm.torrentBuildPager();
    };

    /**
     * orderBySLF
     */
    vm.orderBySLF = function () {
      if (vm.sortSLF === undefined) {
        vm.sortSLF = '-S';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_S');
        vm.sort = '-torrent_seeds';
      } else if (vm.sortSLF === '-S') {
        vm.sortSLF = '+S';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_S');
        vm.sort = 'torrent_seeds';
      } else if (vm.sortSLF === '+S') {
        vm.sortSLF = '-L';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_L');
        vm.sort = '-torrent_leechers';
      } else if (vm.sortSLF === '-L') {
        vm.sortSLF = '+L';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_L');
        vm.sort = 'torrent_leechers';
      } else if (vm.sortSLF === '+L') {
        vm.sortSLF = '-F';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_F');
        vm.sort = '-torrent_finished';
      } else if (vm.sortSLF === '-F') {
        vm.sortSLF = '+F';
        vm.sortSLFString = $translate.instant('TABLE_FIELDS.SORT_F');
        vm.sort = 'torrent_finished';
      } else if (vm.sortSLF === '+F') {
        vm.sortSLF = undefined;
        vm.sortSLFString = undefined;
        vm.sort = undefined;
      }

      vm.torrentBuildPager();
    };

    /**
     *
     * @returns {string|Object}
     */
    vm.getOrderTableHead = function () {
      var res = $translate.instant('TABLE_FIELDS.SEEDS_LEECHERS_FINISHED');
      switch (vm.sortSLF) {
        case '-S':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '<i class="fa fa-caret-down text-info"></i>';
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          break;
        case '+S':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '<i class="fa fa-caret-up text-info"></i>';
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          break;
        case '-L':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '<i class="fa fa-caret-down text-info"></i>';
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          break;
        case '+L':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '<i class="fa fa-caret-up text-info"></i>';
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          break;
        case '-F':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          res += '<i class="fa fa-caret-down text-info"></i>';
          break;
        case '+F':
          res = $translate.instant('TABLE_FIELDS.SORT_S');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_L');
          res += '/' + $translate.instant('TABLE_FIELDS.SORT_F');
          res += '<i class="fa fa-caret-up text-info"></i>';
          break;
      }
      return res;
    };

    /**
     * getResourcePageInfo
     * @param p: page number
     */
    vm.getResourcePageInfo = function (p, callback) {
      //if searchKey or searchTags has value, the skip=0
      var skip = vm.topItems;
      if (vm.searchKey.trim().length > 0 || vm.searchTags.length > 0 || vm.releaseYear || vm.filterHnR || vm.sortVote) {
        skip = 0;
      }

      TorrentsService.get({
        skip: (p - 1) * vm.torrentItemsPerPage + skip,
        limit: vm.torrentItemsPerPage,
        sort: vm.sort,
        keys: vm.searchKey.trim(),
        torrent_status: 'reviewed',
        torrent_type: vm.torrentType,
        torrent_release: vm.releaseYear,
        torrent_tags: vm.searchTags,
        torrent_hnr: vm.filterHnR
      }, function (items) {
        if (items.length === 0) {
          Notification.error({
            message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('LIST_PAGE_INFO_EMPTY')
          });
        } else {
          callback(items);
          mtDebug.info(items);
        }
      }, function (err) {
        Notification.error({
          message: '<i class="glyphicon glyphicon-remove"></i> ' + $translate.instant('LIST_PAGE_INFO_ERROR')
        });
      });
    };

    /**
     * clearAllCondition
     */
    vm.clearAllCondition = function () {
      vm.searchKey = '';
      vm.searchTags = [];
      $('.btn-tag').removeClass('btn-success').addClass('btn-default');

      vm.torrentBuildPager();
    };

    /**
     * onTagClicked
     * @param tag: tag name
     */
    vm.onTagClicked = function (tag) {
      $timeout(function () {
        angular.element('#tag_' + tag).trigger('click');
      }, 100);
    };

    /**
     * onReleaseClicked
     * @param y
     */
    vm.onReleaseClicked = function (y) {
      if (vm.releaseYear === y) {
        vm.releaseYear = undefined;
      } else {
        vm.releaseYear = y;
      }
      vm.torrentBuildPager();
    };

    /**
     * onHnRClicked
     */
    vm.onHnRClicked = function () {
      vm.filterHnR = !vm.filterHnR;
      vm.torrentBuildPager();
    };
    vm.onHnRChanged = function () {
      vm.torrentBuildPager();
    };

    /**
     * getSaleTypeDesc
     */
    vm.getSaleTypeDesc = function (item) {
      var desc = '';

      angular.forEach(vm.torrentSalesType.value, function (st) {
        if (st.name === item.torrent_sale_status) {
          desc = st.desc;
        }
      });
      return desc;
    };

    /**
     * onMoreTagsClicked
     */
    vm.onMoreTagsClicked = function () {
      var e = $('.more-tags');
      var i = $('#more-tags-icon');

      if (!e.hasClass('panel-collapsed')) {
        e.slideUp();
        e.addClass('panel-collapsed');
        i.removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
      } else {
        e.slideDown();
        e.removeClass('panel-collapsed');
        i.removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');
      }
    };

    /**
     * openTorrentInfo
     * @param id
     */
    vm.openTorrentInfo = function (id) {
      var url = $state.href('torrents.view', {torrentId: id});
      $window.open(url, '_blank');
    };
  }
}());

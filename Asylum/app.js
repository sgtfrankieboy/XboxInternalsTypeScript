///<reference path="Assets/Scripts/XboxInternals.d.ts" />
///<reference path="Assets/Scripts/jQuery.d.ts" />
///<reference path="Assets/Scripts/jQueryUI.d.ts" />
window.onload = function () {
    window.addEventListener("dragenter", function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }, false);
    window.addEventListener("dragexit", function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }, false);
    window.addEventListener("dragover", function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }, false);
    window.addEventListener("drop", function (evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = event.dataTransfer.files;
        var count = files.length;

        if (count > 0)
            handleFiles(files);
    }, false);
};

var totalForms = 0;
function handleFiles(files) {
    var _this = this;
    for (var i = 0; i < files.length; i++) {
        XboxInternals.IO.FileIO.LoadFromFile(files[i], function (io) {
            var stfs = new XboxInternals.Stfs.StfsPackage(io, 0);
            console.log(stfs);
            console.log(stfs.metaData.displayName);
            console.log(stfs.metaData.displayName.length);

            var form = createForm("#formStfsPackageExplorer");

            form.on("mousedown", function () {
                $('.form').not(_this).css('z-index', '100');
                $(_this).css('z-index', '1000');
            });
            form.find("#stfs_displayName").val(stfs.metaData.displayName);
            form.find("#stfs_titleName").val(stfs.metaData.titleName);
            form.find("#stfs_titleId").val(stfs.metaData.titleID.toString(16).toUpperCase());
            form.find("#stfs_profileId").val(Uint8ArrayToHexString(stfs.metaData.profileID));
            form.find("#stfs_deviceId").val(Uint8ArrayToHexString(stfs.metaData.deviceID));
            form.find("#stfs_consoleId").val(Uint8ArrayToHexString(stfs.metaData.consoleID));
            form.find("#stfs_thumbnails").html(stfs.metaData.thumbnailImage);

            form.find("#stfs_btnSave").click(function (event) {
                io.SaveFile();
            });

            form.appendTo("#forms");
        });
    }
}

function Uint8ArrayToHexString(array) {
    var hexString = "";

    for (var i = 0; i < array.length; i++)
        hexString += ((array[i] > 0xF) ? "" : "0") + array[i].toString(16);

    return hexString.toUpperCase();
}

function hex(n) {
    var s = "", v;
    for (var i = 7; i >= 0; --i) {
        v = (n >>> (i << 2)) & 0xF;
        s += v.toString(16);
    }
    return s;
}

function createForm(template) {
    var form = $(template).clone();
    form.removeAttr("id");
    form.attr("id", "form-" + ++totalForms);
    form.draggable({
        handle: "header",
        stack: ".form"
    });
    form.find("#windowClose").attr("data-form", form.attr("id"));
    form.find("#windowClose").click(function (event) {
        $("#" + $(event.currentTarget).attr("data-form")).remove();
    });

    return form;
}
//@ sourceMappingURL=app.js.map

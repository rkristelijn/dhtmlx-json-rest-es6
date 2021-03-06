import { DHXView } from 'dhx-optimus';
import route from 'riot-route';

const contactsUrl = 'api/contacts';

export class ContactsGridView extends DHXView {
  render() {
    this.ui = this.root.attachGrid();
    this.ui.enableEditEvents(true, false, true);
    this.ui.enableValidation(true);
    this.ui.setColValidators(",NotEmpty,ValidDate,,ValidEmail,ValidNumeric,");
    this.ui.init();
    this._load(() => {
      this.ui.editCellEvent = this.ui.attachEvent('onEditCell', this.ui.editCellHandler);
    });

    this.ui.confirm = {
      show: (type, title, message, cb) => {
        dhtmlx.message({
          type: type,
          title: title + this.boxCounter,
          text: message,
          callback: function (r) { cb(r); }
        });
        return true;
      }
    }

    //attachEvents Globals
    this.attachEvent('setFieldValue', (id, field, value) => {
      let fieldIndex = this.ui.getColIndexById(field);
      this.ui.cells(id, fieldIndex).setValue(value);
    });
    this.attachEvent('ToolbarClick', (id) => {
      switch (id) {
        case "add":
          this.getService('ContactsGridService').addRow();
          break;
        case "del":
          this.getService('ContactsGridService').deleteSelectedRow();
          break;
      }
    });

    //attachEvents Locals
    this.ui.attachEvent('onRowAdded', (id) => {
      this.getService('ContactsModelService').create({
        name: 'Enter name',
        dob: '01/01/1990',
        pos: 'Sales Manager'
      }).then(data => {
        //console.log('onRowAdded', data);
        this.ui.callEvent('onAfterRowAdded', [id, data._id, data]);
      });
    });
    this.ui.attachEvent('onAfterRowAdded', (tempId, serverId, values) => {
      this.ui.changeRowId(tempId, serverId);
      this.ui.cells(serverId, 0).setValue(values.photo);
      this.ui.cells(serverId, 1).setValue(values.name);
      this.ui.cells(serverId, 2).setValue(values.dob);
      this.ui.cells(serverId, 3).setValue(values.pos);
      window.history.replaceState({ type: 'contact', serverId: serverId }, `Contact: ${serverId}`, `#contacts/${serverId}`);
    });
    this.ui.attachEvent('onAfterRowDeleted', (id, pid) => {
      this.getService('ContactsModelService').delete(id)
        .then(data => {
          //console.log('onAfterRowDeleted', data);
        });
    });
    this.ui.attachEvent('onRowSelect', (id) => {
      let selectedSameRow = this.previousId === id;
      if (!selectedSameRow) {
        this.getService('ContactsModelService').setData(
          this.getService('ContactsGridService').getRowData(id)
        );
        window.history.replaceState({ type: 'contact', id: id }, `Contact: ${id}`, `#contacts/${id}`);
        this.previousId = id;
      }
    });

    this.ui.editCellHandler = (stage, id, colIndex, newValue, oldValue) => {
      const editorClosed = 2;
      if (stage === editorClosed & newValue !== oldValue) {
        let fieldName = this.ui.getColumnId(colIndex);
        this.getService('ContactsModelService').setFieldValue(id, fieldName, newValue);
      }
      return true;
    }

    //services
    this.addService('ContactsGridService', {
      selectFirstRow: () => {
        this.ui.selectRow(0, true);
      },
      selectRow: (id) => {
        this.ui.selectRow(id);
      },
      setCellValue: (id, fieldName, value) => {
        let fieldIndex = this.ui.getColIndexById(fieldName);
        let oldValue = this.ui.cells(id, fieldIndex).getValue();
        this.ui.cells(id, fieldIndex).setValue(value);
        this.ui.callEvent('onEditCell', [2, id, fieldIndex, value, oldValue]);
      },
      selectRowById: (id) => {
        this.ui.selectRowById(id, true, true, true);
      },
      getRowData: (id) => {
        let data = this.ui.getRowData(id);
        data.id = id;
        return data;
      },
      getAllRowIds: () => {
        return this.ui.getAllRowIds(',').split(',');
      },
      getPositions: () => {
        return [
          "Accountant",
          "Back-end Developer",
          "Business Analyst",
          "Chief Engineer",
          "Chief Executive Officer (CEO)",
          "Chief Information Officer (CIO)",
          "Chief Information Security Officer (CISO)",
          "Chief Privacy Officer (CPO)",
          "Front-end Developer",
          "Full-stack Web Developer",
          "HR Manager",
          "Marketing Specialist",
          "Product Manager",
          "Project Manager",
          "QA Engineer",
          "Sales Manager",
          "Web Developer"
        ];
      },
      addRow: (values) => {
        let tempId = this.ui.uid();
        this.ui.addRow(tempId, "");
        this.ui.selectRowById(tempId, true, true, true);
      },
      deleteSelectedRow: () => {
        let id = this.ui.getSelectedRowId();
        let index = this.ui.getRowIndex(id);
        // console.log('deleting', id);
        this.ui.deleteRow(id);

        if (index < this.ui.getRowsNum())
          this.ui.selectRow(index, true);
        else
          this.ui.selectRow(index - 1, true);
      }
    });

    this._populateCombo(this.ui.getCombo(3));
    this.previousId = null;
  }

  _populateCombo(combo) {
    let positions = this.getService('ContactsGridService').getPositions();
    for (let index in positions) {
      combo.put(index, positions[index]);
    }
  }

  _getDetailView() {
    let url = window.location.href.match(/#(.*contacts\/)(.*)/);
    let rowId = url && url.length === 3 ? url[2] : false;
    return rowId;
  }

  _isValidId(id) {
    let ids = this.getService('ContactsGridService').getAllRowIds();
    let search = "" + id;
    return ids.indexOf(search) >= 0;
  }

  _load(callback) {
    this.getService('ContactsModelService').getData().then(
      data => {
        this.ui.parse(data, 'json');
        let rowId = this._getDetailView();
        let isValidId = this._isValidId(rowId);
        if (rowId !== '' && rowId !== false && !isValidId) {
          dhtmlx.alert(`${rowId.replace(/[^a-z0-9]/gi, '')} is not found`);
          route('/contacts');
        } else {
          if (isValidId) {
            this.getService('ContactsGridService').selectRowById(rowId);
          } else {
            this.getService('ContactsGridService').selectFirstRow();
          }
          callback();
        }
      }
    );
  }
}

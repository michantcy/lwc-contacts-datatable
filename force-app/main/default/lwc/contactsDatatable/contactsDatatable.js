import { LightningElement,api, track, wire } from 'lwc';
import getAccountContacts from '@salesforce/apex/AccountService.getAccountContacts';
import attachFilesToRecord from '@salesforce/apex/AccountService.attachFilesToRecord';

import CONTACT_OBJECT from '@salesforce/schema/Contact';
import LEAD_SOURCE_FIELD from '@salesforce/schema/Contact.LeadSource';
import NAME_FIELD from '@salesforce/schema/Contact.Name';

import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';

const columns = [
    { label: 'Name', fieldName: NAME_FIELD.fieldApiName, editable: false },
    {
        label: 'Lead Source', fieldName: LEAD_SOURCE_FIELD.fieldApiName, type: 'picklistColumn', editable: true, typeAttributes: {
            placeholder: 'Choose Type', options: { fieldName: 'pickListOptions' }, 
            value: { fieldName: LEAD_SOURCE_FIELD.fieldApiName },
            context: { fieldName: 'Id' }
        }
    },
    { label: 'Upload', type: 'fileUpload', fieldName: 'Id', typeAttributes: { acceptedFormats: '.jpg,.jpeg,.pdf,.png' } }
]

export default class ContactsDatatable extends LightningElement {
    columns = columns;
    showSpinner = false;
    @api recordId;
    @track data = [];
    @track contactsData;
    @track draftValues = [];
    lastSavedData = [];
    @track pickListOptions;
 
    @wire(getObjectInfo, { objectApiName: CONTACT_OBJECT })
    objectInfo;
 
    @wire(getPicklistValues, {
        recordTypeId: "$objectInfo.data.defaultRecordTypeId",
        fieldApiName: LEAD_SOURCE_FIELD
    })
 
    wirePickList({ error, data }) {
        if (data) {
            this.pickListOptions = data.values;
        } else if (error) {
            console.log(error);
        }
    }
        
    @wire(getAccountContacts, { accountId: '$recordId', pickList: '$pickListOptions' })    
    contactsData(result) {
        this.contactsData = result;
        console.log(this.recordId);
        if (result.data) {
            this.data = JSON.parse(JSON.stringify(result.data));
 
            this.data.forEach(ele => {
                ele.pickListOptions = this.pickListOptions;
            })
 
            this.lastSavedData = JSON.parse(JSON.stringify(this.data));
 
        } else if (result.error) {
            this.data = undefined;
            console.log(result.error);
        }
    };

     
    updateDataValues(updateItem) {
        let copyData = JSON.parse(JSON.stringify(this.data));
 
        copyData.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
            }
        });
         
        this.data = [...copyData];
    }
 
    updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = [...this.draftValues];
        copyDraftValues.forEach(item => {
            if (item.Id === updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });
 
        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }
    }
     
    handleCellChange(event) {        
        let draftValues = event.detail.draftValues;
        draftValues.forEach(ele=>{
            this.updateDraftValues(ele);
        })
    }

    handleUploadFinished(event){        
        // Get the list of uploaded files
        const uploadedFiles = event.detail.uploadedFileIds;

        // Initialize an array to store the IDs of the uploaded files
        let uploadedFileIds = [];

        // Loop through the uploaded files and get the ID of each file
        uploadedFiles.forEach(uploadedFile => {
            uploadedFileIds.push(uploadedFile);
        });

        let paramData = {
        recordId: event.detail.recordId,
        uploadedFileIds: uploadedFileIds
        };

        attachFilesToRecord({ paramData: paramData })
        .then(result => {
            // Show a success message
            this.ShowToast('Success!', 'Files successfully uploaded', 'success', 'dismissable');

        })
        .catch(error => {
            // Show an error message
            this.ShowToast('Error!', error.message, 'error', 'dismissable');
        });
    }
 
    handleSave(event) {
        debugger;
        this.showSpinner = true;
        this.saveDraftValues = this.draftValues;
 
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });
         
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.showToast('Success', 'Records Updated Successfully!', 'success', 'dismissable');
            this.draftValues = [];
            return this.refresh();
        }).catch(error => {
            console.log(error);
            this.showToast('Error', 'An Error Occured!!', 'error', 'dismissable');
        }).finally(() => {
            this.draftValues = [];
            this.showSpinner = false;
        });
    }
 
    handleCancel(event) {        
        this.data = JSON.parse(JSON.stringify(this.lastSavedData));
        this.draftValues = [];
    }
 
    showToast(title, message, variant, mode) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(evt);
    }
     
    async refresh() {
        await refreshApex(this.contactsData);
    }
}
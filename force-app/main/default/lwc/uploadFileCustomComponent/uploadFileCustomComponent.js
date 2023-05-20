import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PocCustomComp extends LightningElement {
    @api recordId;
    @api acceptedFormats;
    handleUploadFinished(event) {
        // Get the list of uploaded files
        const uploadedFiles = event.detail.files;

        // Initialize an array to store the IDs of the uploaded files
        let uploadedFileIds = [];

        // Loop through the uploaded files and get the ID of each file
        uploadedFiles.forEach(uploadedFile => {
            uploadedFileIds.push(uploadedFile.documentId);
        });

        let paramData = {recordId : this.recordId,uploadedFileIds: uploadedFileIds};
        console.log(paramData);
        const ev = new CustomEvent('uploadfinished', {
            composed: true,
            bubbles: true,
            cancelable: true,
            detail: paramData
        });
        this.dispatchEvent(ev);

        this.dispatchEvent(new ShowToastEvent({
            title: 'Completed',
            message: 'File has been uploaded',
        }));
    }
}
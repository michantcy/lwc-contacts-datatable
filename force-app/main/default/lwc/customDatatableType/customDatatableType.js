import LightningDatatable from 'lightning/datatable';
import picklistColumn from './picklistColumn.html';
import pickliststatic from './pickliststatic.html'
import fileUploadColumn from './fileUploadColumn.html'

export default class CustomDatatableType extends LightningDatatable {
    static customTypes = {
        picklistColumn: {
            template: pickliststatic,
            editTemplate: picklistColumn,
            standardCellLayout: true,
            typeAttributes: ['label', 'placeholder', 'options', 'value', 'context', 'variant','name']
        },
        fileUpload: {
            template: fileUploadColumn,
            typeAttributes: ['acceptedFormats'],
        }
    };
}
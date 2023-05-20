public with sharing class AccountService {
    @AuraEnabled (cacheable=true)
    public static List<Account> fetchAccounts(){
      List<Account> accounts = new List<Account>();
      if(
            Account.SObjectType.getDescribe().isAccessible() &&
            Schema.SObjectType.Account.fields.Name.isAccessible() &&
            Schema.SObjectType.Account.fields.Type.isAccessible() &&
            Schema.SObjectType.Account.fields.Phone.isAccessible()
        ) {
          return [SELECT Id, Name, Type, Phone 
          FROM Account LIMIT 20];  
        }
        return accounts;             
    }

    @AuraEnabled (cacheable=true)
    public static List<Contact> getAccountContacts(string accountId){
      try {
        List<Contact> contacts = new List<Contact>();

        if(Contact.SObjectType.getDescribe().isAccessible()){
          contacts = [SELECT Id,Name,LeadSource FROM Contact WHERE AccountId =: accountId];
        }

        return contacts;
        
      } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
      }
    }

    @AuraEnabled
    public static void attachFilesToRecord(Map<String, Object> paramData){
        // Get the ID of the record to which the files should be attached
        Id recordId = (Id) paramData.get('recordId');
        System.debug(recordId);

        // Get the list of IDs of the uploaded files
        List<Object> paramDataDetails = (List<Object>) paramData.get('uploadedFileIds');
        List<String> uploadedFileIds = new List<String>();
        for (Object obj : paramDataDetails) {
            uploadedFileIds.add((String) obj);
        }
        System.debug('File\'s Ids: ' +uploadedFileIds);

        // Create a list to hold the ContentDocumentLink records to be inserted
        List<ContentDocumentLink> contentDocumentLinks = new List<ContentDocumentLink>();

        // Loop through the uploaded file IDs and create a ContentDocumentLink record for each file
        for (String uploadedFileId : uploadedFileIds) {
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = uploadedFileId;
            cdl.LinkedEntityId = recordId;
            cdl.ShareType = 'V';
            cdl.Visibility = 'AllUsers';

            contentDocumentLinks.add(cdl);
        }

        // Insert the ContentDocumentLink records in a try-catch block to handle any exceptions
        Savepoint sp = Database.setSavepoint();
        try {
          if(ContentDocumentLink.SObjectType.getDescribe().isCreateable()){
            insert contentDocumentLinks;
          }            
        } catch (Exception ex) {
            // Roll back the transaction if an exception occurs
            Database.rollback(sp);
    
            // Throw a custom exception with the error message
            throw new AuraHandledException('Failed to attach files to record: ' + ex.getMessage());
        }
    }
  }
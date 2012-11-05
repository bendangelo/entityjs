(function(re){
    
    /*
    Main function for re.e
    
    //create multiple entities
    re.e('spider', 10)
    //returns a query with all entities
    .each(function(index){
        this.posX = index * 10;
    });
    
    */
    var q = function(c, count){
        if(!count){
            return new re.entity.init(c);
        }
        
        //optimize for multiple calls
        var q = re();
        
        //create entity by number of count
        for(var i=0; i<count; i++){
            q.push(re.e(c));
        }
        
        return q;
    };
    
    var e = function(c){
        
        this._re_comps = [];
        this._re_listens = {};
        
        this.comp(c);
    };
    
    var p = e.prototype = re.class.extend({});
    
    /*
    //add components
    this.comp('point text');
    
    this.comp('health physics');
    
    //remove components
    this.removeComp('point');
    */
    p.comp = function(com){
        
        if(!com) return this;
        
        //split a multi word string into smaller one word function calls
        var pieces;
        
        //handle array or string?
        if(re.is(com, 'array')){
            pieces = com;
        } else {
            pieces = com.split(' ');
        }
        
        if(pieces.length > 1){
          for(var i =0;i<pieces.length; i++){
                this.comp(pieces[i]);
            }
            return this;
        } else {
          com = pieces[0];
        }
        
        if(!com) return this;
        
        //component reference
        var c;
        
        //will be sent to init function
        var vals = com.split(':');
        
        com = vals[0];
        
        //remove comp string
        vals.shift();

        //get component ref
        c = re._c[com];

        //if already has component
        if(!this.has(com)){
        
        //add comp first thing, to avoid dupe requirement calls
        //and this lets the init remove the comp too.
        this._re_comps.push(com);
        
        //init component only if it exists
        if(c){
            this.comp(c._re_requires);
            
            if(c._re_defaults){
                this.def(c._re_defaults);
            }
            
            if(c._re_defines){
                this.set(c._re_defines);
            }

            if(c._re_events){
              this.set(c._re_events)
              .on(c._re_events);
            }
            
            if(c._re_init){
                c._re_init.apply(this, vals);
            }
        }

        //add to group
        if(re._g[com]) re._g[com].add(this);
        
      }
        
    
        return this;
    };
    
    p.removeComp = function(com){
        
        var pieces;
        
        //handle string or array?
        if(re.is(com,'array')){
            pieces = com;
        } else {
            pieces = com.split(' ');
        }
        
        if(pieces.length > 1){
            
          var k;
          while(k = pieces.shift()){
            this.removeComp(k);
          }
            
            return this;
        } else {
          com = pieces[0];
        }
        
        if(com && this.has(com)){
          var c = re._c[com];
          //only remove if it exists
          if(c){
              
              if(c._re_dispose){
                  c._re_dispose.call(this, c);
              }
              
          }

          //remove from group
          if(re._g[com]) re._g[com].remove(this);
  
          //remove from array
          this._re_comps.splice(this._re_comps.indexOf(com), 1);
        }
        return this;
    };
    
    /*
    Returns component array
    */
    p.comps = function(){
        return this._re_comps.slice();
    }
    
    p.clone = function(){
        return re.e(this._re_comps);
    }
    
    /*
    Calls methods of parent components.
    
    Use '' to call super of entity
    
    re.e('draw')
    ._super('draw', 'screenX')()
    
    */
    p._super = function(comp, method){
        
        var a = Array.prototype.slice.call(arguments, 2);
        
        if(comp == ''){
            //call entity parent methods
            return re.e.init.prototype[method].apply(this, a);
        }
        
        var c = re._c[comp];
        
        if(c._re_defines[method]){
            return c._re_defines[method].apply(this, a);
        }
        
        return c._re_defaults[method].apply(this, a);
    }
    
    /*
    TODO defines has to multiple item query
    
    this.has('draw');

    //returns true if both present
    this.has('draw update');

    */
    p.has = function(comp){
        
        if(re.is(comp ,'string')){
            
            comp = comp.split(' ');
        }
            
        //check if entitiy contains the correct components
        for(p=0; p<comp.length; p++){
            
            //check if not containing components
            if(!~this._re_comps.indexOf(comp[p])){
                return false;
            }
        }

        return true;
    };
    
    
    p.dispose = function(){
        
        //trigger dispose on all components
        //remove from group too
        this.removeComp(this.comps());
        
        this.trigger('dispose');
        
        //remove all events
        return this.off();
    }
    
    re.entity = re.e = q;
    re.entity.init = e;
    
}(re));
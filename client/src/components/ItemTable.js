import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom'
import TextField from '@material-ui/core/Input';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import OrderableList from './OrderableList';
import { DataGrid } from '@material-ui/data-grid';
import Modal from '@material-ui/core/Modal';

const useStyles = makeStyles((theme) => ({
    paper: {
        position: 'absolute',
        backgroundColor: theme.palette.background.paper,
        border: '2px solid #000',
        boxShadow: theme.shadows[5],
        padding: theme.spacing(2, 4, 3),
    },
    orderableModal: {
        width: 400,
    },
    addItemModal: {
        width: 800,
    }

}));

function getModalStyle() {
    const top = 50;
    const left = 50;
    
    return {
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
    };
}



export default function ItemTable(props) {
    const [modalStyle] = useState(getModalStyle);
    const [items, setItems] = useState(null);
    const [searchValue, setSearchValue] = useState("");
    const [open, setOpen] = useState(false);
    const [itemId, setItemId] = useState(0);
    const [itemQuantity, setItemQuantity] = useState(1);
    
    const columns = [
        { field: 'id', type: 'number',headerName: 'Item ID', width: 100 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'content', headerName: 'Content', width: 200 },
        { field: 'size', headerName: 'Size', width: 130 },
        { field: 'itemtype', headerName: 'Item Type', width: 120 },
        { field: "",
        headerName: "Add Item",
        disableClickEventBubbling: true,
        renderCell: (params) => {
            return <Button onClick={()=> {
                setItemId(params.row.id);
                setOpen(true);
            }}>Add</Button>
            }
        }
    ];
    
    const classes = useStyles();
    function createData(items) {
        console.log(items);
        let it = [];
        for (let i = 0; i < items.length; i++) {
            let newItem = {
                id: items[i].item_id,
                name: items[i].name,
                content: items[i].content,
                size: items[i].size,
                itemtype: items[i].itemtype
            };
            it.push(newItem);
        }
        return it;
    }

    useEffect(() => {
        getItems().then(res => {
            setItems(createData(res));
        });
    }, []);

    async function addItemToOrderable() {
        await axios.post('http://localhost:9000/restaurant/add_item_to_orderable',{
            orderable_name: props.orderable_name,
            item_id: itemId,
            quantity: itemQuantity
        }, {withCredentials: true});
    }

    async function getItems(searchVal) {
        const items = await axios.get('http://localhost:9000/restaurant/list_items', {
        params: {
            in_name: searchVal
        }, withCredentials: true});
        return items.data;
    }

    //setItems(createData(getItems(searchValue)))
    return items ?  (
        <>
        <div>
            <TextField id="outlined-search" label="Search field" type="search" variant="outlined" placeholder="Search Items" onChange={(e) => setSearchValue(e.target.value)}/>
            <Button onClick={()=>getItems(searchValue).then(res => {
            setItems(createData(res))})}>Search</Button>
            <Button onClick={()=>getItems().then(res => {
            setItems(createData(res))})}>Refresh</Button>
            <div style={{ height: 400, width: '100%' }}>
            <DataGrid rows={items} columns={columns} pageSize={5}/>
            </div>
        </div>
        <Modal
        open={open}
        onClose={(e) => setOpen(false)}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
    >
            <div style={modalStyle} className={`${classes.paper} ${classes.addItemModal}`}>
                Quantity?
                <TextField id="outlined-search" label="Item Quantity To Add" type="number" variant="outlined" placeholder="Item Quantity To Add" value={itemQuantity} onChange={(e) => setItemQuantity(Math.max(e.target.value, 1))}/>
                <Button onClick={() => addItemToOrderable()}>Add Item</Button>
            </div>
        </Modal>
    </>
      ): (<span>Loading Table</span>);
}

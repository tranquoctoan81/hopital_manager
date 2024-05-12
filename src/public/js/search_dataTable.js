$(function () {
    var datatable = $('#datatable').DataTable({
        dom: '<"#positionFilter">t'
    });

    $('#positionFilter').html(`<input type="text" style=" border:none; outline:none;
border-bottom: 1px solid #335fc4 ;
width: 30%;
padding: 10px 15px;
font-size: 16px;" class="form-control" placeholder="Tìm kíếm bệnh nhân..">`);

    $(document).on('keyup', '#positionFilter input', function () {
        var value = $(this).val();
        console.log(value);
        datatable.search(value).draw();
    });
});
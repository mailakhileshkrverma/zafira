<div>
    <h3>${subject}</h3>
    <table>
        <tr>
            <td>
                <p>${text}</p>
            </td>
        </tr>
        <#if attachments??>
            <#list attachments as attachment>
                <tr>
                    <td>
                        <img src='cid:${attachment.name?replace(' ', '_')}' style="size: 100%">
                    </td>
                </tr>
            </#list>
        </#if>
    </table>
</div>
